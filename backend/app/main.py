from __future__ import annotations

import logging
import os
import json
import subprocess
import time
import sys
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db import create_engine
from app.routers.vehicle_routes import router as vehicle_router


# Configure logger for the application
logger = logging.getLogger(__name__)

# Path to debug log for instrumentation
LOG_PATH = Path(__file__).resolve().parents[2] / ".cursor" / "debug.log"


def _debug_log(hypothesis_id: str, message: str, data: dict[str, Any]) -> None:
    payload = {
        "sessionId": "debug-session",
        "runId": "run-pre-fix",
        "hypothesisId": hypothesis_id,
        "location": "app/main.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    try:
        with LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
    except Exception:
        # best-effort debug logging; never block startup
        pass


# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
# region agent log
_debug_log(
    "H1",
    "env_loaded",
    {
        "env_path_exists": env_path.exists(),
        "cwd": os.getcwd(),
    },
)
# region agent log
_debug_log(
    "H4",
    "interpreter_info",
    {
        "executable": sys.executable,
        "prefix": sys.prefix,
        "base_prefix": getattr(sys, "base_prefix", None),
        "venv": os.getenv("VIRTUAL_ENV"),
    },
)
# endregion


def _load_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw:
        # region agent log
        _debug_log("H2", "cors_origins_default", {})
        # endregion
        return ["*"]
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    # region agent log
    _debug_log("H2", "cors_origins_env", {"count": len(origins)})
    # endregion
    return origins


def _run_migrations() -> None:
    """Run Alembic migrations at startup."""
    alembic_dir = Path(__file__).parent.parent / "alembic"
    if not alembic_dir.exists():
        logger.warning("Alembic directory not found, skipping migrations")
        return

    try:
        logger.info("Running database migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent.parent,
            capture_output=True,
            text=True,
            check=True,
        )
        logger.info("Migrations completed successfully")
        if result.stdout:
            logger.info(f"Migration output: {result.stdout}")
    except subprocess.CalledProcessError as exc:
        logger.error(f"Migration failed: {exc.stderr}")
        raise RuntimeError(f"Database migration failed: {exc.stderr}") from exc


async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # region agent log
    _debug_log("H3", "lifespan_start", {"database_url_set": bool(os.getenv("DATABASE_URL"))})
    # endregion

    # Run migrations before creating the engine
    _run_migrations()

    try:
        engine = create_engine()
        # region agent log
        _debug_log("H5", "engine_created", {})
        # endregion
    except Exception as exc:  # noqa: BLE001
        # region agent log
        _debug_log("H5", "engine_creation_failed", {"error": str(exc)})
        # endregion
        raise

    app.state.engine = engine
    try:
        yield
    finally:
        # region agent log
        _debug_log("H3", "lifespan_cleanup", {})
        # endregion
        await engine.dispose()


app = FastAPI(lifespan=lifespan, title="Tummala Motors API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def error_boundary(request: Request, call_next: Any) -> JSONResponse:
    try:
        return await call_next(request)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled exception during request processing")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error."},
        )


app.include_router(vehicle_router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


