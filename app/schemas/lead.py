from pydantic import BaseModel, Field
from app.models.lead import LeadStatus


class LeadCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    name: str | None = Field(None, max_length=255)
    comment: str | None = Field(None, max_length=2000)


class LeadRead(BaseModel):
    id: int
    phone: str
    name: str | None
    comment: str | None
    created_at: str
    status: LeadStatus

    class Config:
        from_attributes = True


class LeadStatusUpdate(BaseModel):
    status: LeadStatus
