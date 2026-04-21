"""
Pydantic v2 request / response schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ── Auth request bodies ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username:     str      = Field(min_length=2, max_length=50)
    email:        EmailStr
    password:     str      = Field(min_length=8)
    avatar_color: str      = "#5B21B6"


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UpdateProfileRequest(BaseModel):
    username:     Optional[str] = None
    avatar_color: Optional[str] = None


# ── Auth responses ────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    expires_in:    int  # seconds


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           str
    username:     str
    email:        str
    avatar_color: str
    role:         str
    created_at:   datetime
    last_login:   Optional[datetime] = None


# ── Session schemas ───────────────────────────────────────────────────

class SessionStartResponse(BaseModel):
    session_id: str
    started_at: datetime


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         str
    companion:  str
    started_at: datetime
    ended_at:   Optional[datetime] = None
    duration_s: Optional[int]      = None
    status:     str


class StatsOut(BaseModel):
    total_sessions:    int
    total_interactions: int
    milestones:        list[str]


# ── Interaction schema ────────────────────────────────────────────────

class InteractionOut(BaseModel):
    id:          str
    question:    str
    answer:      str
    topic:       Optional[str] = None
    duration_ms: Optional[int] = None
    created_at:  datetime
