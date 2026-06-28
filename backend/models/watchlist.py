from datetime import datetime

from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from backend.database import Base


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    watched = Column(Boolean, default=False, nullable=False)
    watched_at = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<WatchlistItem(id={self.id}, movie_id={self.movie_id}, watched={self.watched})>"
