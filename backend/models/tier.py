from datetime import datetime

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from backend.database import Base


class TierList(Base):
    __tablename__ = "tier_lists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<TierList(id={self.id}, name='{self.name}')>"


class TierItem(Base):
    __tablename__ = "tier_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tier_list_id = Column(Integer, ForeignKey("tier_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    tier = Column(String(1), nullable=False)  # S, A, B, C, D
    position = Column(Integer, nullable=False, default=0)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<TierItem(id={self.id}, tier='{self.tier}', movie_id={self.movie_id})>"
