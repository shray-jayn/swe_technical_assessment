from __future__ import annotations

import os
from collections.abc import AsyncIterator
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from dotenv import load_dotenv
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


def _get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required.")
    return database_url


def create_engine() -> AsyncEngine:
    database_url = _get_database_url()

    # Convert to asyncpg scheme
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Handle sslmode for asyncpg
    parsed = urlparse(database_url)
    query_items = dict(parse_qsl(parsed.query, keep_blank_values=True))
    sslmode = query_items.pop("sslmode", None)
    if sslmode and sslmode.lower() != "disable":
        query_items["ssl"] = "require"  # asyncpg format

    database_url = urlunparse(
        parsed._replace(query=urlencode(query_items, doseq=True))
    )

    return create_async_engine(database_url, pool_pre_ping=True)


async def get_db_conn(request: Request) -> AsyncIterator[AsyncConnection]:
    engine: AsyncEngine | None = getattr(request.app.state, "engine", None)
    if engine is None:
        raise RuntimeError("Database engine is not initialized.")

    async with engine.connect() as conn:
        yield conn


