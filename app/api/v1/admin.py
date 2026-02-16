from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Admin
from app.schemas.admin import AdminLogin, AdminRead
from app.services.auth import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_admin, check_login_rate_limit

router = APIRouter(prefix="/admin", tags=["admin"])

# Cookie settings
COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 60 * 60 * 24  # 24 hours
COOKIE_HTTP_ONLY = True
COOKIE_SAMESITE = "lax"


@router.post("/login", response_model=AdminRead)
async def login(
    body: AdminLogin,
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_db)],
):
    check_login_rate_limit(request)
    result = await session.execute(select(Admin).where(Admin.username == body.username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    token = create_access_token(data={"sub": admin.username})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=COOKIE_HTTP_ONLY,
        samesite=COOKIE_SAMESITE,
        path="/",
    )
    return AdminRead(id=admin.id, username=admin.username)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=AdminRead)
async def me(admin: Annotated[Admin, Depends(get_current_admin)]):
    return AdminRead(id=admin.id, username=admin.username)
