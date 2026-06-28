from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.movie import Movie
from backend.models.tier import TierList, TierItem
from backend.models.user import User
from backend.schemas.tier import (
    TierListCreate,
    TierListResponse,
    TierItemCreate,
    TierItemUpdate,
    TierItemResponse,
)
from backend.schemas.movie import MovieResponse
from backend.services.auth_service import get_current_user

router = APIRouter(prefix="/tiers", tags=["Tier Lists"])


@router.get("/", response_model=List[TierListResponse])
def get_tier_lists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all tier lists for the current user."""
    tier_lists = (
        db.query(TierList)
        .filter(TierList.user_id == current_user.id)
        .order_by(TierList.created_at.desc())
        .all()
    )

    result = []
    for tl in tier_lists:
        items = (
            db.query(TierItem)
            .filter(TierItem.tier_list_id == tl.id)
            .order_by(TierItem.tier, TierItem.position)
            .all()
        )
        item_responses = _build_tier_item_responses(items, db)
        result.append(
            TierListResponse(
                id=tl.id,
                name=tl.name,
                items=item_responses,
                created_at=tl.created_at,
            )
        )
    return result


@router.post("/", response_model=TierListResponse, status_code=status.HTTP_201_CREATED)
def create_tier_list(
    tier_list_data: TierListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new tier list for the current user."""
    new_list = TierList(
        user_id=current_user.id,
        name=tier_list_data.name,
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    return TierListResponse(
        id=new_list.id,
        name=new_list.name,
        items=[],
        created_at=new_list.created_at,
    )


@router.get("/{tier_list_id}", response_model=TierListResponse)
def get_tier_list(
    tier_list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific tier list with its items."""
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    items = (
        db.query(TierItem)
        .filter(TierItem.tier_list_id == tier_list.id)
        .order_by(TierItem.tier, TierItem.position)
        .all()
    )
    item_responses = _build_tier_item_responses(items, db)

    return TierListResponse(
        id=tier_list.id,
        name=tier_list.name,
        items=item_responses,
        created_at=tier_list.created_at,
    )


@router.put("/{tier_list_id}", response_model=TierListResponse)
def update_tier_list(
    tier_list_id: int,
    tier_list_data: TierListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a tier list's name."""
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    tier_list.name = tier_list_data.name
    db.commit()
    db.refresh(tier_list)

    items = (
        db.query(TierItem)
        .filter(TierItem.tier_list_id == tier_list.id)
        .order_by(TierItem.tier, TierItem.position)
        .all()
    )
    item_responses = _build_tier_item_responses(items, db)

    return TierListResponse(
        id=tier_list.id,
        name=tier_list.name,
        items=item_responses,
        created_at=tier_list.created_at,
    )


@router.delete("/{tier_list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tier_list(
    tier_list_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a tier list and all its items."""
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    # Delete items first
    db.query(TierItem).filter(TierItem.tier_list_id == tier_list.id).delete()
    db.delete(tier_list)
    db.commit()


@router.post(
    "/{tier_list_id}/items",
    response_model=TierItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_tier_item(
    tier_list_id: int,
    item_data: TierItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a movie to a tier list."""
    # Validate tier list ownership
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    # Validate tier value
    if item_data.tier not in ("S", "A", "B", "C", "D"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tier must be one of: S, A, B, C, D",
        )

    # Validate movie exists
    movie = db.query(Movie).filter(Movie.id == item_data.movie_id).first()
    if movie is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found",
        )

    # Check for duplicate
    existing = (
        db.query(TierItem)
        .filter(
            TierItem.tier_list_id == tier_list_id,
            TierItem.movie_id == item_data.movie_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie already exists in this tier list",
        )

    # Calculate next position for this tier
    max_pos = (
        db.query(TierItem)
        .filter(
            TierItem.tier_list_id == tier_list_id,
            TierItem.tier == item_data.tier,
        )
        .count()
    )

    new_item = TierItem(
        tier_list_id=tier_list_id,
        movie_id=item_data.movie_id,
        tier=item_data.tier,
        position=max_pos,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    movie_response = MovieResponse.model_validate(movie)
    return TierItemResponse(
        id=new_item.id,
        movie_id=new_item.movie_id,
        movie=movie_response,
        tier=new_item.tier,
        position=new_item.position,
    )


@router.put("/{tier_list_id}/items/{item_id}", response_model=TierItemResponse)
def update_tier_item(
    tier_list_id: int,
    item_id: int,
    update_data: TierItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an item's tier or position."""
    # Validate ownership
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    item = (
        db.query(TierItem)
        .filter(TierItem.id == item_id, TierItem.tier_list_id == tier_list_id)
        .first()
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier item not found",
        )

    if update_data.tier is not None:
        if update_data.tier not in ("S", "A", "B", "C", "D"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tier must be one of: S, A, B, C, D",
            )
        item.tier = update_data.tier

    if update_data.position is not None:
        item.position = update_data.position

    db.commit()
    db.refresh(item)

    movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
    movie_response = MovieResponse.model_validate(movie) if movie else None

    return TierItemResponse(
        id=item.id,
        movie_id=item.movie_id,
        movie=movie_response,
        tier=item.tier,
        position=item.position,
    )


@router.delete(
    "/{tier_list_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_tier_item(
    tier_list_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove an item from a tier list."""
    tier_list = (
        db.query(TierList)
        .filter(TierList.id == tier_list_id, TierList.user_id == current_user.id)
        .first()
    )
    if tier_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier list not found",
        )

    item = (
        db.query(TierItem)
        .filter(TierItem.id == item_id, TierItem.tier_list_id == tier_list_id)
        .first()
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tier item not found",
        )

    db.delete(item)
    db.commit()


def _build_tier_item_responses(
    items: List[TierItem], db: Session
) -> List[TierItemResponse]:
    """Convert a list of TierItem ORM objects to TierItemResponse schemas."""
    responses = []
    for item in items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        movie_response = MovieResponse.model_validate(movie) if movie else None
        responses.append(
            TierItemResponse(
                id=item.id,
                movie_id=item.movie_id,
                movie=movie_response,
                tier=item.tier,
                position=item.position,
            )
        )
    return responses
