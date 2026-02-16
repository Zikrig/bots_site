from typing_extensions import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Product, Admin
from app.schemas.product import ProductRead, ProductCreate, ProductUpdate, ProductReorderItem
from app.api.deps import get_current_admin

router = APIRouter(prefix="/products", tags=["products"])
router_admin = APIRouter(prefix="/admin/products", tags=["admin-products"])


def _product_to_read(p: Product) -> ProductRead:
    return ProductRead(
        id=p.id,
        title=p.title,
        slug=p.slug,
        description=p.description,
        short_description=p.short_description,
        image_url=p.image_url,
        sort_order=p.sort_order,
        is_visible=p.is_visible,
        created_at=p.created_at.isoformat() if p.created_at else "",
        updated_at=p.updated_at.isoformat() if p.updated_at else "",
    )


@router.get("", response_model=list[ProductRead])
async def list_products_public(
    session: Annotated[AsyncSession, Depends(get_db)],
):
    """Публичный список только видимых товаров по sort_order."""
    result = await session.execute(
        select(Product)
        .where(Product.is_visible == True)
        .order_by(Product.sort_order, Product.id)
    )
    products = result.scalars().all()
    return [_product_to_read(p) for p in products]


@router_admin.get("", response_model=list[ProductRead])
async def list_products_admin(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    result = await session.execute(
        select(Product).order_by(Product.sort_order, Product.id)
    )
    products = result.scalars().all()
    return [_product_to_read(p) for p in products]


@router_admin.post("", response_model=ProductRead)
async def create_product(
    body: ProductCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    product = Product(
        title=body.title,
        slug=body.slug,
        description=body.description,
        short_description=body.short_description,
        image_url=body.image_url or "",
        sort_order=body.sort_order,
        is_visible=body.is_visible,
    )
    session.add(product)
    await session.flush()
    await session.refresh(product)
    return _product_to_read(product)


@router_admin.get("/{product_id}", response_model=ProductRead)
async def get_product_admin(
    product_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return _product_to_read(product)


@router_admin.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(product, k, v)
    await session.flush()
    await session.refresh(product)
    return _product_to_read(product)


@router_admin.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    await session.delete(product)
    return None


@router_admin.patch("/reorder")
async def reorder_products(
    body: list[ProductReorderItem],
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[Admin, Depends(get_current_admin)],
):
    for item in body:
        result = await session.execute(select(Product).where(Product.id == item.id))
        product = result.scalar_one_or_none()
        if product:
            product.sort_order = item.sort_order
    return {"ok": True}
