"""
Beanie ODM document — stored in MongoDB Atlas (voiceverse.interactions).
"""
from datetime import datetime
from typing import Any, Optional

from beanie import Document
from pydantic import Field
from pymongo import IndexModel, ASCENDING, DESCENDING


class Interaction(Document):
    """One Q&A exchange within a voice session."""

    session_id:  str
    user_id:     str
    question:    str
    answer:      str
    topic:       Optional[str]      = None
    duration_ms: Optional[int]      = None
    created_at:  datetime           = Field(default_factory=datetime.utcnow)
    metadata:    dict[str, Any]     = Field(default_factory=dict)

    class Settings:
        name = "interactions"
        indexes = [
            IndexModel([("session_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
        ]
