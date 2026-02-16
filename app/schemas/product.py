from pydantic import BaseModel, Field


class ProductRead(BaseModel):
    id: int
    title: str
    slug: str | None
    description: str
    short_description: str
    image_url: str
    sort_order: int
    is_visible: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str = Field(default="", max_length=10000)
    short_description: str = Field(default="", max_length=500)
    image_url: str = Field(default="", max_length=512)
    sort_order: int = 0
    is_visible: bool = True


class ProductUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str | None = None
    short_description: str | None = Field(None, max_length=500)
    image_url: str | None = Field(None, max_length=512)
    sort_order: int | None = None
    is_visible: bool | None = None


class ProductReorderItem(BaseModel):
    id: int
    sort_order: int


class ProductReorder(BaseModel):
    items: list[ProductReorderItem]
