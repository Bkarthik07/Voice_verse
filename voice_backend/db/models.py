"""
SQLAlchemy ORM models — stored in TiDB Cloud.
Users, RefreshTokens, VoiceSessions, Milestones.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String, Boolean, DateTime, Integer,
    ForeignKey, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.tidb import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Users ─────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id:            Mapped[str]           = mapped_column(String(36),  primary_key=True, default=_uuid)
    email:         Mapped[str]           = mapped_column(String(255), unique=True, nullable=False, index=True)
    username:      Mapped[str]           = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str]           = mapped_column(String(255), nullable=False)
    avatar_color:  Mapped[str]           = mapped_column(String(7),   default="#5B21B6")
    role:          Mapped[str]           = mapped_column(String(20),  default="student")
    is_active:     Mapped[bool]          = mapped_column(Boolean,     default=True)
    created_at:    Mapped[datetime]      = mapped_column(DateTime,    server_default=func.now())
    last_login:    Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    voice_sessions: Mapped[list["VoiceSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    milestones: Mapped[list["Milestone"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


# ── Refresh Tokens ────────────────────────────────────────────────────
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id:          Mapped[str]      = mapped_column(String(36),  primary_key=True, default=_uuid)
    user_id:     Mapped[str]      = mapped_column(String(36),  ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash:  Mapped[str]      = mapped_column(String(64),  unique=True, nullable=False, index=True)
    expires_at:  Mapped[datetime] = mapped_column(DateTime,    nullable=False)
    revoked:     Mapped[bool]     = mapped_column(Boolean,     default=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime,    server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


# ── Voice Sessions ────────────────────────────────────────────────────
class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id:         Mapped[str]           = mapped_column(String(36),  primary_key=True, default=_uuid)
    user_id:    Mapped[str]           = mapped_column(String(36),  ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    companion:  Mapped[str]           = mapped_column(String(50),  default="eva")
    started_at: Mapped[datetime]      = mapped_column(DateTime,    server_default=func.now())
    ended_at:   Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_s: Mapped[Optional[int]] = mapped_column(Integer,    nullable=True)
    status:     Mapped[str]           = mapped_column(String(20),  default="active")

    user: Mapped["User"] = relationship(back_populates="voice_sessions")


# ── Milestones ────────────────────────────────────────────────────────
class Milestone(Base):
    __tablename__ = "milestones"

    id:        Mapped[str]      = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:   Mapped[str]      = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key:       Mapped[str]      = mapped_column(String(50), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime,   server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="milestones")
