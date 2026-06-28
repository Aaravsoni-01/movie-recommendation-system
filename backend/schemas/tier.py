from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from backend.schemas.movie import MovieResponse


class TierItemCreate(BaseModel):
    movie_id: int
    tier: str  # S, A, B, C, D


class TierItemUpdate(BaseModel):
    tier: Optional[str] = None
    position: Optional[int] = None


class TierItemResponse(BaseModel):
    id: int
    movie_id: int
    movie: Optional[MovieResponse] = None
    tier: str
    position: int

    model_config = {"from_attributes": True}


class TierListCreate(BaseModel):
    name: str


class TierListResponse(BaseModel):
    id: int
    name: str
    items: List[TierItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
