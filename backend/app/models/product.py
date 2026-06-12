from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductVariant(BaseModel):
    sku: str
    size: Optional[str] = None
    color: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str
    description: str
    short_description: Optional[str] = None
    category: str
    brand: Optional[str] = None
    images: List[str] = []
    tags: List[str] = []
    base_price: float = Field(..., gt=0)
    variants: List[ProductVariant] = []
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    base_price: Optional[float] = None
    variants: Optional[List[ProductVariant]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    slug: str
    description: str
    short_description: Optional[str] = None
    category: str
    brand: Optional[str] = None
    images: List[str] = []
    tags: List[str] = []
    base_price: float
    variants: List[ProductVariant] = []
    is_active: bool = True
    is_featured: bool = False
    sold_count: int = 0
    rating_avg: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ProductResponse(ProductInDB):
    pass


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
