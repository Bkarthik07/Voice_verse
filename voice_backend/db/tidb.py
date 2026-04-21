"""
TiDB Cloud engine via SQLAlchemy 2.0 (sync pymysql) wrapped in
asyncio.to_thread so FastAPI stays fully async.

Why not aiomysql? aiomysql's SSL implementation is broken on Windows for
TiDB Cloud's specific SSL config — pymysql connects fine.
"""
import os
import asyncio
import functools
from typing import AsyncGenerator

import config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


# ── Build sync engine (pymysql) ───────────────────────────────────────
def _build_url() -> str:
    """Convert any mysql+aiomysql:// URL to mysql+pymysql://."""
    url = config.TIDB_URL
    for prefix in ("mysql+aiomysql://", "mysql+asyncmy://"):
        if url.startswith(prefix):
            return url.replace(prefix, "mysql+pymysql://", 1)
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+pymysql://", 1)
    return url


_SSL_ARGS = {"ssl": {"ca": os.path.abspath(config.TIDB_CA_PATH)}} \
    if os.path.exists(config.TIDB_CA_PATH) else {}

engine = create_engine(
    _build_url(),
    connect_args=_SSL_ARGS,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

SessionLocal = sessionmaker(engine, expire_on_commit=False, autocommit=False, autoflush=False)


# ── ORM Base ─────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Async session wrapper ─────────────────────────────────────────────
class AsyncSessionLocal:
    """
    Thin async context-manager that runs sync SQLAlchemy calls in a
    thread pool so FastAPI handlers remain non-blocking.
    """

    def __init__(self):
        self._session: Session | None = None

    async def __aenter__(self) -> "AsyncSessionLocal":
        self._session = await asyncio.to_thread(SessionLocal)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await asyncio.to_thread(self._session.close)

    # --- proxy the most-used session methods as async wrappers ----------

    async def execute(self, stmt, params=None):
        sess = self._session
        return await asyncio.to_thread(
            lambda: sess.execute(stmt) if params is None else sess.execute(stmt, params)
        )

    async def commit(self):
        sess = self._session
        await asyncio.to_thread(sess.commit)

    async def refresh(self, obj):
        sess = self._session
        await asyncio.to_thread(sess.refresh, obj)

    async def close(self):
        sess = self._session
        await asyncio.to_thread(sess.close)

    def add(self, obj):
        """add() is sync and fast — no thread needed."""
        self._session.add(obj)

    async def merge(self, obj):
        sess = self._session
        return await asyncio.to_thread(sess.merge, obj)

    async def delete(self, obj):
        sess = self._session
        await asyncio.to_thread(sess.delete, obj)


# ── FastAPI dependency ────────────────────────────────────────────────
async def get_tidb() -> AsyncGenerator[AsyncSessionLocal, None]:
    """Yields an async-wrapped session; auto-closes after request."""
    db = AsyncSessionLocal()
    await db.__aenter__()
    try:
        yield db
    finally:
        await db.__aexit__(None, None, None)


# ── Startup helper ────────────────────────────────────────────────────
async def init_tidb_tables():
    """Create all tables that are not yet present (idempotent)."""
    def _create():
        from db import models  # noqa: F401 — ensure models are registered
        Base.metadata.create_all(engine)

    await asyncio.to_thread(_create)
    print("[TiDB] Tables verified / created OK.")
