from typing import Literal
from pydantic import BaseModel

from backend.schemas.movie import MovieResponse


class RecommendationResponse(BaseModel):
    movie: MovieResponse
    reason: str
    score: float


class MoodRequest(BaseModel):
    mood: Literal["funny", "scary", "thrilling", "epic", "heartwarming", "thoughtful"]
