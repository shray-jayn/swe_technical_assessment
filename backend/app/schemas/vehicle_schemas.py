from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


NonEmptyStr = Annotated[str, Field(min_length=1)]


class VehicleCreate(BaseModel):
    vin: NonEmptyStr
    make: NonEmptyStr
    model: NonEmptyStr
    description: NonEmptyStr
    image_urls: list[str] = Field(default_factory=list)

    @field_validator("image_urls")
    @classmethod
    def ensure_urls(cls, value: list[str]) -> list[str]:
        if not value:
            return []
        cleaned: list[str] = []
        for item in value:
            item = item.strip()
            if not item:
                continue
            cleaned.append(item)
        return cleaned


class VehicleOut(BaseModel):
    vin: str
    make: str
    model: str
    description: str
    image_urls: list[str]
    created_at: datetime | None = None


class VehicleListItem(BaseModel):
    vin: str
    make: str
    model: str
    created_at: datetime | None = None


class VehicleListResponse(BaseModel):
    items: list[VehicleListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


