import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base
import enum


class WinnerEnum(str, enum.Enum):
    black = "B"
    white = "W"
    draw = "draw"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id: Mapped[str] = mapped_column(String(100), nullable=False)
    black_nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    white_nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    winner: Mapped[WinnerEnum] = mapped_column(Enum(WinnerEnum), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    moves = Column(JSON, nullable=False)
    final_board: Mapped[str] = mapped_column(Text, nullable=False)
    winner_review: Mapped[str | None] = mapped_column(String(60), nullable=True)
