"""
MongoDB Atlas connection via Motor (async) + Beanie ODM.
"""
import config
import motor.motor_asyncio
from beanie import init_beanie
from typing import Optional

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None


async def init_mongo():
    """Connect to Atlas and initialise Beanie ODM with all document models."""
    global _client
    from db.documents import Interaction  # local import avoids circular deps

    _client = motor.motor_asyncio.AsyncIOMotorClient(config.MONGO_URL)
    await init_beanie(
        database=_client.voiceverse,
        document_models=[Interaction],
    )
    print("[MongoDB] Connected to Atlas cluster OK.")


async def close_mongo():
    global _client
    if _client:
        _client.close()
        print("[MongoDB] Connection closed.")
