from typing import Any
"""
Sessions router  start, end, history, stats, interactions.
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func

import config
from db.tidb import get_tidb
from db.models import User, VoiceSession, Milestone
from db.documents import Interaction
from db.schemas import (
    SessionStartResponse, SessionOut, StatsOut, InteractionOut,
)
from auth.dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


#  Start session 
@router.post("/start", response_model=SessionStartResponse, status_code=201)
async def start_session(
    companion: str = "eva",
    db: Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    session = VoiceSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        companion=companion,
        status="active",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionStartResponse(session_id=session.id, started_at=session.started_at)


#  End session 
@router.patch("/{session_id}/end", response_model=SessionOut)
async def end_session(
    session_id: str,
    db: Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(VoiceSession).where(
            VoiceSession.id == session_id,
            VoiceSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    now = datetime.utcnow()
    session.ended_at = now
    session.status = "completed"
    if session.started_at:
        delta = (now - session.started_at).total_seconds()
        session.duration_s = max(0, int(delta))

    await db.commit()
    await db.refresh(session)

    # Award milestones based on completed session count
    await _check_milestones(current_user.id, db)

    return session


#  Session history (paginated) 
@router.get("/history", response_model=list[SessionOut])
async def get_history(
    page:  int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(VoiceSession)
        .where(VoiceSession.user_id == current_user.id)
        .order_by(VoiceSession.started_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


#  User stats 
@router.get("/stats", response_model=StatsOut)
async def get_stats(
    db: Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    # Total sessions from TiDB
    result = await db.execute(
        select(func.count(VoiceSession.id))
        .where(VoiceSession.user_id == current_user.id)
    )
    total_sessions = result.scalar() or 0

    # Earned milestones from TiDB
    result = await db.execute(
        select(Milestone.key).where(Milestone.user_id == current_user.id)
    )
    milestone_keys = [row[0] for row in result.all()]

    # Total interactions from MongoDB Atlas
    total_interactions = await Interaction.find(
        Interaction.user_id == current_user.id
    ).count()

    return StatsOut(
        total_sessions=total_sessions,
        total_interactions=total_interactions,
        milestones=milestone_keys,
    )


#  Interactions for a session 
@router.get("/{session_id}/interactions", response_model=list[InteractionOut])
async def get_interactions(
    session_id: str,
    db: Any = Depends(get_tidb),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(VoiceSession).where(
            VoiceSession.id == session_id,
            VoiceSession.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    items = await Interaction.find(
        Interaction.session_id == session_id
    ).sort("-created_at").to_list()

    return [
        InteractionOut(
            id=str(i.id),
            question=i.question,
            answer=i.answer,
            topic=i.topic,
            duration_ms=i.duration_ms,
            created_at=i.created_at,
        )
        for i in items
    ]


#  Internal: milestone checker 
async def _check_milestones(user_id: str, db: Any):
    """Award milestone badges after each session end."""
    count_res = await db.execute(
        select(func.count(VoiceSession.id)).where(
            VoiceSession.user_id == user_id,
            VoiceSession.status == "completed",
        )
    )
    count = count_res.scalar() or 0

    earned_res = await db.execute(
        select(Milestone.key).where(Milestone.user_id == user_id)
    )
    earned = {row[0] for row in earned_res.all()}

    new_milestones = []
    candidates = [
        (1,  "first_session"),
        (5,  "five_sessions"),
        (10, "ten_sessions"),
        (25, "twenty_five_sessions"),
    ]
    for threshold, key in candidates:
        if count >= threshold and key not in earned:
            new_milestones.append(
                Milestone(id=str(uuid.uuid4()), user_id=user_id, key=key)
            )

    if new_milestones:
        for m in new_milestones:
            db.add(m)
        await db.commit()
        print(f"[Milestones]  Awarded {[m.key for m in new_milestones]} to {user_id}")
