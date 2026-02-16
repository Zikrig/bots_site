from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.database import Base


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    closed = "closed"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus), default=LeadStatus.new, nullable=False
    )
