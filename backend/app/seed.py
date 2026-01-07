from __future__ import annotations

import argparse
import asyncio
import csv
from pathlib import Path
from typing import Any

from app.db import create_engine
from app.queries.vehicle_queries import vehicles_table
from sqlalchemy.dialects.postgresql import insert

DEFAULT_CSV_PATH = Path(__file__).resolve().parents[2] / "assets" / "swe_technical_assessment_data.csv"


def _read_csv_rows(csv_path: Path, limit: int | None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for idx, row in enumerate(reader):
            if limit is not None and idx >= limit:
                break
            photo_urls_raw = row.get("PhotoURLs", "") or ""
            image_urls = [item.strip() for item in photo_urls_raw.split(",") if item.strip()]
            rows.append(
                {
                    "vin": row.get("VIN", "").strip(),
                    "make": row.get("Make", "").strip(),
                    "model": row.get("Model", "").strip(),
                    "description": row.get("WebAdDescription", "").strip(),
                    "image_urls": image_urls,
                }
            )
    return [item for item in rows if item["vin"]]


async def seed(csv_path: Path, limit: int | None) -> None:
    engine = create_engine()
    to_insert = _read_csv_rows(csv_path, limit)
    if not to_insert:
        print("No rows to insert from CSV.")
        return

    stmt = (
        insert(vehicles_table)
        .values(to_insert)
        .on_conflict_do_nothing(index_elements=[vehicles_table.c.vin])
    )

    async with engine.begin() as conn:
        result = await conn.execute(stmt)
        inserted = result.rowcount or 0
    await engine.dispose()
    print(f"Inserted {inserted} vehicle(s).")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed vehicles from CSV.")
    parser.add_argument(
        "--csv-path",
        type=Path,
        default=DEFAULT_CSV_PATH,
        help=f"Path to CSV file (default: {DEFAULT_CSV_PATH})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Number of rows to import (default: 5; use -1 for all).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    limit_value = None if args.limit is None or args.limit < 0 else args.limit
    asyncio.run(seed(args.csv_path, limit_value))


