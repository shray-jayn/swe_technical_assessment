from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
import json
import time
from pathlib import Path
from typing import Any

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db import get_db_conn
from app.queries.vehicle_queries import (
    build_count_vehicles_stmt,
    build_create_vehicle_stmt,
    build_get_vehicle_by_vin_stmt,
    build_list_vehicles_stmt,
    vehicle_row_to_dict,
)
from app.schemas.vehicle_schemas import (
    VehicleCreate,
    VehicleListItem,
    VehicleListResponse,
    VehicleOut,
)


router = APIRouter(prefix="/vehicles", tags=["vehicles"])

LOG_PATH = Path(__file__).resolve().parents[3] / ".cursor" / "debug.log"


def _debug_log(hypothesis_id: str, message: str, data: dict[str, Any]) -> None:
    payload = {
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": hypothesis_id,
        "location": "app/routers/vehicle_routes.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    try:
        with LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(payload) + "\n")
    except Exception:
        pass


@router.get("/", response_model=VehicleListResponse)
async def list_vehicles(
    conn: AsyncConnection = Depends(get_db_conn),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
) -> VehicleListResponse:
    # region agent log
    _debug_log("H1", "list_vehicles_start", {})
    # endregion
    offset = (page - 1) * page_size
    stmt = build_list_vehicles_stmt(limit=page_size, offset=offset)
    result = await conn.execute(stmt)
    rows = result.fetchall()
    # region agent log
    _debug_log("H2", "list_vehicles_rows_fetched", {"rows_count": len(rows)})
    # endregion
    payloads: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        item_dict = vehicle_row_to_dict(row)
        if index == 0:
            # region agent log
            _debug_log(
                "H3",
                "list_vehicles_sample_row",
                {
                    "vin": item_dict.get("vin"),
                    "image_type": type(item_dict.get("image_urls")).__name__,
                    "created_at_type": type(item_dict.get("created_at")).__name__,
                },
            )
            # endregion
        payloads.append(item_dict)

    validated_items: list[VehicleListItem] = []
    for item in payloads:
        try:
            validated_items.append(VehicleListItem.model_validate(item))
        except ValidationError as exc:
            # region agent log
            _debug_log(
                "H3",
                "list_vehicles_validation_error",
                {"errors": exc.errors(), "payload": item},
            )
            # endregion
            raise

    total_result = await conn.execute(build_count_vehicles_stmt())
    total = total_result.scalar_one()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # region agent log
    _debug_log(
        "H4",
        "list_vehicles_success",
        {
            "return_count": len(validated_items),
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    )
    # endregion

    return VehicleListResponse(
        items=validated_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{vin}", response_model=VehicleOut)
async def get_vehicle(vin: str, conn: AsyncConnection = Depends(get_db_conn)) -> VehicleOut:
    stmt = build_get_vehicle_by_vin_stmt(vin=vin)
    result = await conn.execute(stmt)
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    return VehicleOut.model_validate(vehicle_row_to_dict(row))


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=VehicleOut)
async def create_vehicle(payload: VehicleCreate, conn: AsyncConnection = Depends(get_db_conn)) -> VehicleOut:
    stmt = build_create_vehicle_stmt(
        vin=payload.vin,
        make=payload.make,
        model=payload.model,
        description=payload.description,
        image_urls=payload.image_urls,
    )
    try:
        result = await conn.execute(stmt)
        await conn.commit()
    except IntegrityError as exc:
        await conn.rollback()
        if getattr(exc.orig, "pgcode", None) == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle with this VIN already exists.",
            ) from exc
        raise

    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create vehicle.")

    return VehicleOut.model_validate(vehicle_row_to_dict(row))


