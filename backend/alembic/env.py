from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, async_engine_from_config

from app.queries.vehicle_queries import metadata

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _get_base_database_url() -> str:
    """Return the DATABASE_URL in sync (psycopg) form."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for migrations.")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    return database_url


def _get_async_database_url() -> str:
    """Return an asyncpg-compatible URL derived from DATABASE_URL."""
    database_url = _get_base_database_url()
    parsed = urlparse(database_url)

    scheme = parsed.scheme
    if scheme.startswith("postgresql") and "+asyncpg" not in scheme:
        scheme = "postgresql+asyncpg"

    query_items = dict(parse_qsl(parsed.query, keep_blank_values=True))
    sslmode = query_items.pop("sslmode", None)
    if sslmode and sslmode.lower() != "disable":
        # asyncpg expects "ssl" instead of "sslmode"
        query_items["ssl"] = "require"

    async_url = urlunparse(
        parsed._replace(scheme=scheme, query=urlencode(query_items, doseq=True))
    )
    return async_url


def run_migrations_offline() -> None:
    url = _get_base_database_url()
    context.configure(
        url=url,
        target_metadata=metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=metadata, compare_type=True)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    alembic_section = config.get_section(config.config_ini_section) or {}
    alembic_section["sqlalchemy.url"] = _get_async_database_url()

    connectable: AsyncEngine = async_engine_from_config(
        alembic_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as async_connection:
        await async_connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())


