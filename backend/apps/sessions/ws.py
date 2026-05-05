"""
In-memory WebSocket connection manager for game sessions.
One RoomState per active session code.
"""
import json
import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from fastapi import WebSocket


@dataclass
class RoomState:
    code: str
    teacher_ws: Optional[WebSocket] = None
    students: dict = field(default_factory=dict)    # participant_id → WebSocket
    q_started_at: Optional[datetime] = None
    answered_this_q: set = field(default_factory=set)   # participant_ids
    first_correct_this_q: bool = False
    # answer distribution per option index [A, B, C, D]
    answer_dist: list = field(default_factory=lambda: [0, 0, 0, 0])


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, RoomState] = {}

    def _get_room(self, code: str) -> RoomState:
        if code not in self.rooms:
            self.rooms[code] = RoomState(code=code)
        return self.rooms[code]

    async def connect_teacher(self, code: str, ws: WebSocket):
        await ws.accept()
        room = self._get_room(code)
        room.teacher_ws = ws

    async def connect_student(self, code: str, participant_id: int, ws: WebSocket):
        await ws.accept()
        room = self._get_room(code)
        room.students[participant_id] = ws

    def disconnect_teacher(self, code: str):
        if code in self.rooms:
            self.rooms[code].teacher_ws = None

    def disconnect_student(self, code: str, participant_id: int):
        if code in self.rooms:
            self.rooms[code].students.pop(participant_id, None)

    def cleanup_room(self, code: str):
        self.rooms.pop(code, None)

    async def send_teacher(self, code: str, message: dict):
        room = self.rooms.get(code)
        if room and room.teacher_ws:
            try:
                await room.teacher_ws.send_json(message)
            except Exception:
                room.teacher_ws = None

    async def send_student(self, code: str, participant_id: int, message: dict):
        room = self.rooms.get(code)
        if room:
            ws = room.students.get(participant_id)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    room.students.pop(participant_id, None)

    async def broadcast_students(self, code: str, message: dict):
        room = self.rooms.get(code)
        if not room:
            return
        dead = []
        for pid, ws in room.students.items():
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(pid)
        for pid in dead:
            room.students.pop(pid, None)

    async def broadcast_all(self, code: str, message: dict):
        await self.send_teacher(code, message)
        await self.broadcast_students(code, message)


manager = ConnectionManager()


def _compute_points(time_limit_s: int, response_time_ms: int, is_first_correct: bool) -> int:
    time_limit_ms = time_limit_s * 1000
    remaining_ms = max(0, time_limit_ms - response_time_ms)
    speed_bonus = round((remaining_ms / time_limit_ms) * 900)
    pts = 100 + speed_bonus
    if is_first_correct:
        pts += 50
    return pts


def _build_leaderboard(participants, limit: int | None = None) -> list[dict]:
    sorted_p = sorted(participants, key=lambda p: p.score, reverse=True)
    if limit:
        sorted_p = sorted_p[:limit]
    return [
        {
            "rank": i + 1,
            "nickname": p.nickname,
            "avatar_id": p.avatar_id,
            "score": p.score,
        }
        for i, p in enumerate(sorted_p)
    ]


async def handle_teacher_message(data: dict, code: str, session, db, delta_scores: dict):
    """Process a message from the teacher WebSocket."""
    msg_type = data.get("type")
    room = manager.rooms.get(code)
    if not room:
        return

    if msg_type == "start_game":
        from apps.sessions.models import GameSession
        import json as _json

        session.status = "active"
        session.current_q = 0
        db.commit()

        questions = _json.loads(session.questions)
        q = questions[0]
        room.q_started_at = datetime.utcnow()
        room.answered_this_q = set()
        room.first_correct_this_q = False
        room.answer_dist = [0, 0, 0, 0]

        await manager.broadcast_all(code, {
            "type": "question_start",
            "index": 0,
            "question": q["question"],
            "options": q["options"],
            "time_limit": session.time_per_q,
            "total_questions": len(questions),
        })

    elif msg_type == "show_results":
        import json as _json

        questions = _json.loads(session.questions)
        q = questions[session.current_q]
        participants = [p for p in session.participants if p.is_active]
        lb = _build_leaderboard(participants, limit=5)

        # Include delta scores (points earned this round)
        for entry in lb:
            entry["delta"] = delta_scores.get(entry["nickname"], 0)

        await manager.broadcast_all(code, {
            "type": "question_result",
            "correct_answer": q["correct"],
            "leaderboard": lb,
        })
        delta_scores.clear()

    elif msg_type == "next_question":
        import json as _json

        questions = _json.loads(session.questions)
        next_idx = session.current_q + 1

        if next_idx >= len(questions):
            # Game over
            session.status = "finished"
            session.finished_at = datetime.utcnow()
            session.current_q = next_idx
            db.commit()

            participants = [p for p in session.participants if p.is_active]
            lb = _build_leaderboard(participants)
            await manager.broadcast_all(code, {
                "type": "game_over",
                "leaderboard": lb,
            })
            manager.cleanup_room(code)
        else:
            session.current_q = next_idx
            db.commit()

            q = questions[next_idx]
            room.q_started_at = datetime.utcnow()
            room.answered_this_q = set()
            room.first_correct_this_q = False
            room.answer_dist = [0, 0, 0, 0]

            await manager.broadcast_all(code, {
                "type": "question_start",
                "index": next_idx,
                "question": q["question"],
                "options": q["options"],
                "time_limit": session.time_per_q,
                "total_questions": len(questions),
            })

    elif msg_type == "end_game":
        session.status = "finished"
        session.finished_at = datetime.utcnow()
        db.commit()

        participants = [p for p in session.participants if p.is_active]
        lb = _build_leaderboard(participants)
        await manager.broadcast_all(code, {
            "type": "game_over",
            "leaderboard": lb,
        })
        manager.cleanup_room(code)


async def handle_student_message(
    data: dict,
    code: str,
    participant_id: int,
    session,
    db,
    delta_scores: dict,
):
    """Process a message from a student WebSocket."""
    msg_type = data.get("type")
    room = manager.rooms.get(code)
    if not room:
        return

    if msg_type == "submit_answer":
        # Reject if lobby or not active
        if session.status != "active":
            return

        # Reject duplicate answer
        if participant_id in room.answered_this_q:
            return

        # Reject if time expired
        if room.q_started_at:
            elapsed_ms = int((datetime.utcnow() - room.q_started_at).total_seconds() * 1000)
            time_limit_ms = session.time_per_q * 1000
            if elapsed_ms > time_limit_ms + 2000:  # 2s grace
                return
            response_time_ms = min(elapsed_ms, time_limit_ms)
        else:
            return

        import json as _json
        questions = _json.loads(session.questions)
        q = questions[session.current_q]
        answer = data.get("answer", "")
        is_correct = answer.strip() == q["correct"].strip()

        # Compute points
        is_first = is_correct and not room.first_correct_this_q
        if is_first:
            room.first_correct_this_q = True
        pts = _compute_points(session.time_per_q, response_time_ms, is_first) if is_correct else 0

        # Update answer distribution
        try:
            idx = q["options"].index(answer)
            if 0 <= idx < 4:
                room.answer_dist[idx] += 1
        except ValueError:
            pass

        # Save to DB
        from apps.sessions.models import SessionAnswer, SessionParticipant
        participant = db.query(SessionParticipant).filter(
            SessionParticipant.id == participant_id
        ).first()

        if participant:
            participant.score += pts
            db.add(SessionAnswer(
                session_id=session.id,
                participant_id=participant_id,
                question_index=session.current_q,
                answer=answer,
                is_correct=is_correct,
                response_time_ms=response_time_ms,
                points_earned=pts,
            ))
            db.commit()
            delta_scores[participant.nickname] = delta_scores.get(participant.nickname, 0) + pts

        room.answered_this_q.add(participant_id)

        # Notify student: their result
        await manager.send_student(code, participant_id, {
            "type": "answer_received",
            "is_correct": is_correct,
            "points_earned": pts,
            "correct_answer": q["correct"],
        })

        # Notify teacher: progress
        active_count = len([s for s in room.students])
        answered_count = len(room.answered_this_q)
        await manager.send_teacher(code, {
            "type": "answer_progress",
            "answered": answered_count,
            "total": active_count,
            "distribution": room.answer_dist,
        })
