from typing import Dict, Any, List
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.movie import Movie
from backend.models.tier import TierList, TierItem
from backend.models.user import User
from backend.schemas.movie import MovieResponse
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns analytics dashboard data:
    - genre_distribution: dict of genre → count
    - tier_breakdown: dict of tier → count
    - total_rated: int
    - avg_rating: float
    - favorite_genre: str
    - recent_ratings: list of recent tier items with movie info
    """
    # Get all user's tier items
    user_tier_lists = db.query(TierList).filter(TierList.user_id == current_user.id).all()
    user_list_ids = [tl.id for tl in user_tier_lists]

    tier_items: List[TierItem] = []
    if user_list_ids:
        tier_items = (
            db.query(TierItem)
            .filter(TierItem.tier_list_id.in_(user_list_ids))
            .order_by(TierItem.added_at.desc())
            .all()
        )

    total_rated = len(tier_items)

    # Tier breakdown
    tier_breakdown: Counter = Counter()
    for item in tier_items:
        tier_breakdown[item.tier] += 1

    # Genre distribution and avg rating
    genre_counts: Counter = Counter()
    ratings: List[float] = []

    for item in tier_items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            if movie.imdb_rating:
                ratings.append(movie.imdb_rating)
            for g in (movie.genre or "").split(","):
                g = g.strip()
                if g:
                    genre_counts[g] += 1

    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
    favorite_genre = genre_counts.most_common(1)[0][0] if genre_counts else "N/A"

    # Recent ratings (last 10)
    recent_ratings: List[Dict[str, Any]] = []
    for item in tier_items[:10]:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            recent_ratings.append({
                "tier_item_id": item.id,
                "tier": item.tier,
                "position": item.position,
                "added_at": item.added_at.isoformat() if item.added_at else None,
                "movie": MovieResponse.model_validate(movie).model_dump(),
            })

    return {
        "genre_distribution": dict(genre_counts.most_common()),
        "tier_breakdown": dict(tier_breakdown),
        "total_rated": total_rated,
        "avg_rating": avg_rating,
        "favorite_genre": favorite_genre,
        "recent_ratings": recent_ratings,
    }


@router.get("/history")
def get_rating_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Return rating history timeline data — all tier items sorted chronologically.
    """
    user_tier_lists = db.query(TierList).filter(TierList.user_id == current_user.id).all()
    user_list_ids = [tl.id for tl in user_tier_lists]

    if not user_list_ids:
        return []

    tier_items = (
        db.query(TierItem)
        .filter(TierItem.tier_list_id.in_(user_list_ids))
        .order_by(TierItem.added_at.asc())
        .all()
    )

    history: List[Dict[str, Any]] = []
    for item in tier_items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            # Find the tier list name
            tier_list = db.query(TierList).filter(TierList.id == item.tier_list_id).first()
            list_name = tier_list.name if tier_list else "Unknown"

            history.append({
                "tier_item_id": item.id,
                "tier_list_name": list_name,
                "tier": item.tier,
                "position": item.position,
                "added_at": item.added_at.isoformat() if item.added_at else None,
                "movie": MovieResponse.model_validate(movie).model_dump(),
            })

    return history
