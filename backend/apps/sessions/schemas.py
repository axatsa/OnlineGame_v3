from pydantic import BaseModel
from typing import Optional


class CreateSessionRequest(BaseModel):
    log_id: int
    time_per_q: Optional[int] = 20


class CreateSessionResponse(BaseModel):
    code: str
    session_id: int


class JoinSessionRequest(BaseModel):
    nickname: str
    avatar_id: Optional[str] = None


class JoinSessionResponse(BaseModel):
    participant_id: int
    session_id: int
    nickname: str
    avatar_id: Optional[str]


class SessionInfoResponse(BaseModel):
    code: str
    topic: Optional[str]
    generator_type: str
    status: str
    participant_count: int
    time_per_q: int
    question_count: int


class LeaderboardEntry(BaseModel):
    rank: int
    nickname: str
    avatar_id: Optional[str]
    score: int
