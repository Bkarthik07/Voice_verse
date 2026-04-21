"""
JWT creation / validation and password hashing utilities.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import config
from jose import JWTError, jwt

# ── Password hashing (plain bcrypt, no passlib) ───────────────────────


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ── Access token (short-lived JWT) ────────────────────────────────────
def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub":   user_id,
        "email": email,
        "exp":   expire,
        "iat":   datetime.now(timezone.utc),
        "type":  "access",
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Returns the decoded payload dict or None if invalid / expired."""
    try:
        payload = jwt.decode(
            token,
            config.JWT_SECRET,
            algorithms=[config.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


# ── Refresh token (long-lived opaque token) ───────────────────────────
def create_refresh_token() -> tuple:
    """Returns (raw_token, sha256_hash) — store only the hash in DB."""
    raw = secrets.token_hex(32)          # 256-bit random
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
