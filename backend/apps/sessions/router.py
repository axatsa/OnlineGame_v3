import json
import random
import string
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from apps.auth.dependencies import get_current_user
from apps.auth.models import User
from apps.generator.models import GenerationLog
from apps.sessions.models import GameSession, SessionParticipant, SessionAnswer
from apps.sessions.schemas import (
    CreateSessionRequest, CreateSessionResponse,
    JoinSessionRequest, JoinSessionResponse,
    SessionInfoResponse, LeaderboardEntry,
)
from apps.sessions.ws import manager, handle_teacher_message, handle_student_message, _build_leaderboard
from config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/sessions", tags=["sessions"])

SUPPORTED_TYPES = {"quiz", "assignment"}


def _generate_code(db: Session) -> str:
    """Generate a unique 6-digit numeric session code."""
    for _ in range(20):
        code = "".join(random.choices(string.digits, k=6))
        exists = db.query(GameSession).filter(GameSession.code == code).first()
        if not exists:
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique code")


def _extract_questions(generator_type: str, content: str) -> list[dict]:
    """Normalize questions from GenerationLog.content into session format."""
    data = json.loads(content)
    questions = []

    if generator_type == "quiz":
        for q in data.get("questions", []):
            if q.get("options"):
                questions.append({
                    "question": q.get("q", ""),
                    "options": q.get("options", []),
                    "correct": q.get("a", ""),
                })
    elif generator_type == "assignment":
        # assignment is stored directly as the root dict in GenerationLog
        for q in data.get("questions", []):
            if q.get("options"):
                questions.append({
                    "question": q.get("text", ""),
                    "options": q.get("options", []),
                    "correct": q.get("answer", ""),
                })

    return questions


# ─── REST ────────────────────────────────────────────────────────────────────

@router.post("/create", response_model=CreateSessionResponse)
def create_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    log = db.query(GenerationLog).filter(
        GenerationLog.id == body.log_id,
        GenerationLog.user_id == user.id,
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Generation not found")
    if log.generator_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Sessions only support: {', '.join(SUPPORTED_TYPES)}",
        )

    questions = _extract_questions(log.generator_type, log.content)
    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions found in this generation")

    time_per_q = max(10, min(60, body.time_per_q or 20))
    code = _generate_code(db)

    session = GameSession(
        code=code,
        teacher_id=user.id,
        log_id=log.id,
        generator_type=log.generator_type,
        topic=log.topic,
        time_per_q=time_per_q,
        questions=json.dumps(questions, ensure_ascii=False),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return CreateSessionResponse(code=code, session_id=session.id)


@router.get("/{code}/info", response_model=SessionInfoResponse)
def get_session_info(code: str, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = json.loads(session.questions)
    active_count = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session.id,
        SessionParticipant.is_active == True,
    ).count()

    return SessionInfoResponse(
        code=session.code,
        topic=session.topic,
        generator_type=session.generator_type,
        status=session.status,
        participant_count=active_count,
        time_per_q=session.time_per_q,
        question_count=len(questions),
    )


@router.post("/{code}/join", response_model=JoinSessionResponse)
def join_session(code: str, body: JoinSessionRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "waiting":
        raise HTTPException(status_code=400, detail="Session has already started or ended")

    nickname = body.nickname.strip()[:20]
    if not nickname:
        raise HTTPException(status_code=400, detail="Nickname required")

    taken = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session.id,
        SessionParticipant.nickname == nickname,
        SessionParticipant.is_active == True,
    ).first()
    if taken:
        raise HTTPException(status_code=409, detail="Nickname already taken")

    participant = SessionParticipant(
        session_id=session.id,
        nickname=nickname,
        avatar_id=body.avatar_id,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return JoinSessionResponse(
        participant_id=participant.id,
        session_id=session.id,
        nickname=participant.nickname,
        avatar_id=participant.avatar_id,
    )


@router.get("/{code}/results")
def get_session_results(code: str, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.code == code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "finished":
        raise HTTPException(status_code=400, detail="Session not finished yet")

    participants = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session.id,
        SessionParticipant.is_active == True,
    ).all()

    return _build_leaderboard(participants)


# ─── WebSockets ──────────────────────────────────────────────────────────────

@router.websocket("/{code}/host")
async def ws_host(code: str, websocket: WebSocket, token: str = Query(...)):
    # Verify JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close(code=4001)
            return

        session = db.query(GameSession).filter(
            GameSession.code == code,
            GameSession.teacher_id == user.id,
        ).first()
        if not session:
            await websocket.close(code=4004)
            return

        await manager.connect_teacher(code, websocket)

        # Send current lobby state
        participants = db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session.id,
            SessionParticipant.is_active == True,
        ).all()
        await manager.send_teacher(code, {
            "type": "lobby_update",
            "participants": [{"id": p.id, "nickname": p.nickname, "avatar_id": p.avatar_id} for p in participants],
        })

        delta_scores: dict[str, int] = {}

        while True:
            data = await websocket.receive_json()
            db.refresh(session)
            await handle_teacher_message(data, code, session, db, delta_scores)

    except WebSocketDisconnect:
        manager.disconnect_teacher(code)
    except Exception as e:
        manager.disconnect_teacher(code)
    finally:
        db.close()


@router.websocket("/{code}/student")
async def ws_student(code: str, websocket: WebSocket, pid: int = Query(...)):
    db = SessionLocal()
    try:
        session = db.query(GameSession).filter(GameSession.code == code).first()
        if not session:
            await websocket.close(code=4004)
            return

        participant = db.query(SessionParticipant).filter(
            SessionParticipant.id == pid,
            SessionParticipant.session_id == session.id,
            SessionParticipant.is_active == True,
        ).first()
        if not participant:
            await websocket.close(code=4003)
            return

        await manager.connect_student(code, pid, websocket)

        # Get current participants for lobby_update
        participants = db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session.id,
            SessionParticipant.is_active == True,
        ).all()
        await manager.send_student(code, pid, {
            "type": "lobby_update",
            "participants": [{"id": p.id, "nickname": p.nickname, "avatar_id": p.avatar_id} for p in participants],
        })

        # Notify teacher about new participant
        await manager.send_teacher(code, {
            "type": "lobby_update",
            "participants": [{"id": p.id, "nickname": p.nickname, "avatar_id": p.avatar_id} for p in participants],
        })

        delta_scores: dict[str, int] = {}

        while True:
            data = await websocket.receive_json()
            db.refresh(session)
            await handle_student_message(data, code, pid, session, db, delta_scores)

    except WebSocketDisconnect:
        manager.disconnect_student(code, pid)
        # Mark as inactive
        try:
            participant = db.query(SessionParticipant).filter(
                SessionParticipant.id == pid
            ).first()
            if participant:
                participant.is_active = False
                db.commit()
        except Exception:
            pass
    except Exception:
        manager.disconnect_student(code, pid)
    finally:
        db.close()
