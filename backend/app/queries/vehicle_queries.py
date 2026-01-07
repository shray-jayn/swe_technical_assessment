from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import ARRAY, TIMESTAMP, Column, MetaData, Table, Text, func, insert, select

metadata = MetaData()

vehicles_table = Table(
    "vehicles",
    metadata,
    Column("vin", Text, primary_key=True),
    Column("make", Text, nullable=False),
    Column("model", Text, nullable=False),
    Column("description", Text, nullable=False),
    Column("image_urls", ARRAY(Text), nullable=False, server_default="{}"),
    Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now()),
)


def build_list_vehicles_stmt(*, limit: int, offset: int) -> Any:
    return (
        select(
            vehicles_table.c.vin,
            vehicles_table.c.make,
            vehicles_table.c.model,
            vehicles_table.c.created_at,
        )
        .order_by(vehicles_table.c.created_at.desc())
        .limit(limit)
        .offset(offset)
    )


def build_count_vehicles_stmt() -> Any:
    return select(func.count()).select_from(vehicles_table)


def build_get_vehicle_by_vin_stmt(*, vin: str) -> Any:
    return select(
        vehicles_table.c.vin,
        vehicles_table.c.make,
        vehicles_table.c.model,
        vehicles_table.c.description,
        vehicles_table.c.image_urls,
        vehicles_table.c.created_at,
    ).where(vehicles_table.c.vin == vin)


def build_create_vehicle_stmt(
    *,
    vin: str,
    make: str,
    model: str,
    description: str,
    image_urls: list[str],
) -> Any:
    return (
        insert(vehicles_table)
        .values(
            vin=vin,
            make=make,
            model=model,
            description=description,
            image_urls=image_urls,
        )
        .returning(
            vehicles_table.c.vin,
            vehicles_table.c.make,
            vehicles_table.c.model,
            vehicles_table.c.description,
            vehicles_table.c.image_urls,
            vehicles_table.c.created_at,
        )
    )


def vehicle_row_to_dict(row: Any) -> dict[str, Any]:
    image_data = getattr(row, "image_urls", None)
    image_urls = image_data if image_data is not None else []

    created_at = getattr(row, "created_at", None)

    return {
        "vin": row.vin,
        "make": row.make,
        "model": row.model,
        "description": getattr(row, "description", None),
        "image_urls": image_urls,
        "created_at": created_at,
    }


