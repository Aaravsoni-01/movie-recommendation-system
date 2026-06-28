from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.movie import Movie
from backend.models.tier import TierList, TierItem
from backend.models.user import User
from backend.schemas.recommendation import RecommendationResponse, MoodRequest
from backend.schemas.movie import MovieResponse
from backend.services.auth_service import get_current_user
from backend.services.recommender import (
    get_content_based_recommendations,
    get_collaborative_recommendations,
    get_mood_recommendations,
    get_watch_next,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=List[RecommendationResponse])
def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get personalized recommendations for the current user.
    Uses collaborative filtering if the user has tier data,
    falls back to trending movies otherwise.
    """
    # Check if user has any tier data
    user_tier_lists = db.query(TierList).filter(TierList.user_id == current_user.id).all()
    user_list_ids = [tl.id for tl in user_tier_lists]

    has_tiers = False
    if user_list_ids:
        item_count = (
            db.query(TierItem)
            .filter(TierItem.tier_list_id.in_(user_list_ids))
            .count()
        )
        has_tiers = item_count > 0

    if has_tiers:
        # Try collaborative first
        results = get_collaborative_recommendations(current_user.id, db, limit=10)
        if results:
            return results

        # Fall back to content-based from their highest-rated movie
        top_item = (
            db.query(TierItem)
            .filter(
                TierItem.tier_list_id.in_(user_list_ids),
                TierItem.tier.in_(["S", "A"]),
            )
            .first()
        )
        if top_item:
            results = get_content_based_recommendations(top_item.movie_id, db, limit=10)
            if results:
                return results

    # Fallback: trending movies
    trending = (
        db.query(Movie)
        .filter(Movie.imdb_rating.isnot(None))
        .order_by(Movie.imdb_rating.desc())
        .limit(10)
        .all()
    )
    return [
        RecommendationResponse(
            movie=MovieResponse.model_validate(m),
            reason=f"Highly rated film ({m.imdb_rating}/10) — a great pick to get started!",
            score=round((m.imdb_rating or 5.0) / 10.0, 4),
        )
        for m in trending
    ]


@router.get("/similar/{movie_id}", response_model=List[RecommendationResponse])
def get_similar_movies(
    movie_id: int,
    db: Session = Depends(get_db),
):
    """Get content-based similar movies for a given movie."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if movie is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found",
        )

    results = get_content_based_recommendations(movie_id, db, limit=10)
    return results


@router.post("/mood", response_model=List[RecommendationResponse])
def mood_based_recommendations(
    mood_request: MoodRequest,
    db: Session = Depends(get_db),
):
    """Get mood-based movie recommendations."""
    results = get_mood_recommendations(mood_request.mood, db, limit=10)
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No movies found matching the '{mood_request.mood}' mood",
        )
    return results


@router.get("/watch-next", response_model=List[RecommendationResponse])
def watch_next_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a curated 'watch next' queue for the current user."""
    results = get_watch_next(current_user.id, db, limit=5)
    return results
