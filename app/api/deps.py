from collections import defaultdict
from datetime import datetime, timedelta
from typing_extensions import Annotated

from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPCookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Admin
from app.services.auth import decode_access_token

security = HTTPBearer(auto_error=False)
cookie_scheme = HTTPCookie(auto_error=False)

# In-memory rate limits (use Redis in production)
_lead_ips: dict[str, list[datetime]] = defaultdict(list)
_login_attempts: dict[str, list[datetime]] = defaultdict(list)


def _clean_old(entries: list[datetime], window: timedelta) -> None:
    cutoff = datetime.utcnow() - window
    while entries and entries[0] < cutoff:
        entries.pop(0)


def get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def check_lead_rate_limit(request: Request) -> None:
    ip = get_client_ip(request)
    _clean_old(_lead_ips[ip], timedelta(days=1))
    from app.config import settings
    if len(_lead_ips[ip]) >= settings.lead_rate_limit_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Превышен лимит заявок. Попробуйте завтра.",
        )
    _lead_ips[ip].append(datetime.utcnow())


def check_login_rate_limit(request: Request) -> None:
    ip = get_client_ip(request)
    from app.config import settings
    window = timedelta(minutes=settings.login_attempts_window_minutes)
    _clean_old(_login_attempts[ip], window)
    if len(_login_attempts[ip]) >= settings.login_attempts_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много попыток входа. Подождите 15 минут.",
        )
    _login_attempts[ip].append(datetime.utcnow())


async def get_current_admin(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_db)],
    token: str | None = Depends(lambda r: r.cookies.get("access_token")),
) -> Admin:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация",
        )
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительная сессия",
        )
    username = payload["sub"]
    result = await session.execute(select(Admin).where(Admin.username == username))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )
    return admin
