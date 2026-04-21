"""
Auth router — /auth/register, /auth/login, /auth/refresh,
              /auth/logout, /auth/me, PATCH /auth/me
"""
import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update

import config
from db.tidb import get_tidb
from db.models import User, RefreshToken, Milestone
from db.schemas import (
    RegisterRequest, LoginRequest, RefreshRequest, LogoutRequest,
    UpdateProfileRequest, TokenResponse, UserProfile,
)
from auth.jwt_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, hash_token,
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_token_response(user: User) -> tuple[str, str, RefreshToken]:
    """Helper: create access + refresh tokens and the RefreshToken ORM row."""
    access = create_access_token(user.id, user.email)
    raw_rt, hashed_rt = create_refresh_token()
    rt_row = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=hashed_rt,
        expires_at=datetime.utcnow() + timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return access, raw_rt, rt_row


# ── Register ──────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: Any = Depends(get_tidb)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
        avatar_color=body.avatar_color,
    )
    db.add(user)
    db.add(Milestone(id=str(uuid.uuid4()), user_id=user.id, key="joined"))

    access, raw_rt, rt_row = _make_token_response(user)
    db.add(rt_row)
    await db.commit()

    return TokenResponse(
        access_token=access,
        refresh_token=raw_rt,
        expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Login ─────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Any = Depends(get_tidb)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    # Update last_login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login=datetime.utcnow())
    )

    access, raw_rt, rt_row = _make_token_response(user)
    db.add(rt_row)
    await db.commit()

    return TokenResponse(
        access_token=access,
        refresh_token=raw_rt,
        expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Refresh ───────────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(body: RefreshRequest, db: Any = Depends(get_tidb)):
    token_hash = hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )
    rt = result.scalar_one_or_none()
    if not rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    # Rotate — revoke old, issue new
    rt.revoked = True

    result = await db.execute(select(User).where(User.id == rt.user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled")

    access, raw_rt, new_rt_row = _make_token_response(user)
    db.add(new_rt_row)
    await db.commit()

    return TokenResponse(
        access_token=access,
        refresh_token=raw_rt,
        expires_in=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Logout ────────────────────────────────────────────────────────────
@router.post("/logout", status_code=204)
async def logout(
    body: LogoutRequest,
    db:   Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    token_hash = hash_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == current_user.id,
        )
    )
    rt = result.scalar_one_or_none()
    if rt:
        rt.revoked = True
        await db.commit()


# ── Get profile ───────────────────────────────────────────────────────
@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Update profile ────────────────────────────────────────────────────
@router.patch("/me", response_model=UserProfile)
async def update_me(
    body: UpdateProfileRequest,
    db:   Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    if body.username is not None:
        current_user.username = body.username
    if body.avatar_color is not None:
        current_user.avatar_color = body.avatar_color
    await db.commit()
    await db.refresh(current_user)
    return current_user
