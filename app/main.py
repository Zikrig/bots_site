from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates
from pathlib import Path

from app.database import engine, Base
from app.api.v1 import products, leads, admin as admin_api


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Create default admin if no admins exist
    from app.database import async_session_maker
    from app.models import Admin
    from app.services.auth import get_password_hash
    from app.config import settings
    from sqlalchemy import select
    async with async_session_maker() as session:
        result = await session.execute(select(Admin).limit(1))
        if result.scalar_one_or_none() is None:
            admin = Admin(
                username=settings.admin_username,
                password_hash=get_password_hash(settings.admin_password),
            )
            session.add(admin)
            await session.commit()
    yield
    await engine.dispose()


app = FastAPI(
    title="Боты — витрина Telegram-ботов",
    lifespan=lifespan,
)

# Static and templates
static_path = Path(__file__).parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
templates_path = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_path))

# API v1
app.include_router(products.router, prefix="/api/v1")
app.include_router(products.router_admin, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(leads.router_admin, prefix="/api/v1")
app.include_router(admin_api.router, prefix="/api/v1")


# --- Pages (Jinja2) ---

@app.get("/")
async def index(request):
    from app.database import async_session_maker
    from app.models import Product
    from sqlalchemy import select
    async with async_session_maker() as session:
        result = await session.execute(
            select(Product)
            .where(Product.is_visible == True)
            .order_by(Product.sort_order, Product.id)
        )
        products_list = result.scalars().all()
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "products": products_list},
    )


@app.get("/admin")
async def admin_redirect(request):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/admin/login", status_code=302)


@app.get("/admin/login")
async def admin_login_page(request):
    return templates.TemplateResponse("admin/login.html", {"request": request})


@app.get("/admin/dashboard")
async def admin_dashboard(request):
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})


@app.get("/admin/products")
async def admin_products_page(request):
    return templates.TemplateResponse("admin/products.html", {"request": request})


@app.get("/admin/leads")
async def admin_leads_page(request):
    return templates.TemplateResponse("admin/leads.html", {"request": request})
