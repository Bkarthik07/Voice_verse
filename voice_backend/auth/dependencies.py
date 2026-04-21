"""
FastAPI dependency functions for authentication.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from typing import Optional, Any

from db.tidb import get_tidb, AsyncSessionLocal
from db.models import User
from auth.jwt_utils import decode_access_token

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db:          Any                          = Depends(get_tidb),
) -> User:
    """Validate Bearer JWT and return the corresponding User row."""
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return user


# ── WebSocket helper (no FastAPI dependency injection) ────────────────
async def ws_validate_token(token: Optional[str], db: AsyncSessionLocal) -> Optional[User]:
    """Used directly in WebSocket endpoints (can't use Depends there)."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()
    return user if (user and user.is_active) else None
