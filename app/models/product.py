from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    short_description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    image_url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
