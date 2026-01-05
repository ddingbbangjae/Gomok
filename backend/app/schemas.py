import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from .models import WinnerEnum


class RoomCreate(BaseModel):
    nickname: str


class RoomJoin(BaseModel):
    nickname: str


class MatchBase(BaseModel):
    id: uuid.UUID
    room_id: str
    black_nickname: str
    white_nickname: str
    winner: WinnerEnum
    started_at: datetime
    finished_at: datetime
    moves: list[int]
    final_board: str
    winner_review: Optional[str]

    class Config:
        from_attributes = True


class MatchCreate(BaseModel):
    room_id: str
    black_nickname: str
    white_nickname: str
    winner: WinnerEnum
    started_at: datetime
    finished_at: datetime
    moves: list[int]
    final_board: str
    winner_review: Optional[str] = None


class ReviewCreate(BaseModel):
    user_id: str
    text: str = Field(max_length=60)
