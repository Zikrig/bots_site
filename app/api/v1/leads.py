from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Lead, Admin
from app.models.lead import LeadStatus
from app.schemas.lead import LeadCreate, LeadRead, LeadStatusUpdate
from app.api.deps import get_current_admin, check_lead_rate_limit

router = APIRouter(prefix="/leads", tags=["leads"])
router_admin = APIRouter(prefix="/admin/leads", tags=["admin-leads"])


def _lead_to_read(l: Lead) -> LeadRead:
    return LeadRead(
        id=l.id,
        phone=l.phone,
        name=l.name,
        comment=l.comment,
        created_at=l.created_at.isoformat() if l.created_at else "",
        status=l.status,
    )


@router.post("", response_model=LeadRead, status_code=201)
async def create_lead(
    body: LeadCreate,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    check_lead_rate_limit(request)
    lead = Lead(phone=body.phone, name=body.name, comment=body.comment)
    session.add(lead)
    await session.flush()
    await session.refresh(lead)
    return _lead_to_read(lead)


@router_admin.get("", response_model=list[LeadRead])
async def list_leads_admin(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
    status_filter: LeadStatus | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    q = select(Lead)
    if status_filter is not None:
        q = q.where(Lead.status == status_filter)
    q = q.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(q)
    leads = result.scalars().all()
    return [_lead_to_read(l) for l in leads]


@router_admin.patch("/{lead_id}", response_model=LeadRead)
async def update_lead_status(
    lead_id: int,
    body: LeadStatusUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    result = await session.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    lead.status = body.status
    await session.flush()
    await session.refresh(lead)
    return _lead_to_read(lead)
