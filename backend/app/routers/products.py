from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Optional
from math import ceil

from app.database import get_db
from app.models.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.models.review import ReviewCreate, ReviewResponse
from app.middleware.auth_middleware import require_admin, get_current_user

router = APIRouter(prefix="/api/products", tags=["Products"])


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("", response_model=ProductListResponse)
async def list_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    category: Optional[str] = None,
    q: Optional[str] = None,           # Full-text search
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("created_at", regex="^(created_at|base_price|sold_count|rating_avg)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
):
    query: dict = {"is_active": True}
    if category:
        query["category"] = category
    if q:
        query["$text"] = {"$search": q}
    if min_price is not None:
        query.setdefault("base_price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("base_price", {})["$lte"] = max_price

    sort_direction = -1 if order == "desc" else 1
    skip = (page - 1) * page_size

    total = await db.products.count_documents(query)
    cursor = db.products.find(query).sort(sort_by, sort_direction).skip(skip).limit(page_size)
    items = [_serialize(doc) async for doc in cursor]

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total else 1,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Hỗ trợ tìm theo ID hoặc slug
    query = {"slug": product_id} if not ObjectId.is_valid(product_id) else {"_id": ObjectId(product_id)}
    product = await db.products.find_one({**query, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return _serialize(product)


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    existing = await db.products.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug đã tồn tại")

    doc = data.model_dump()
    doc.update({
        "is_active": True,
        "sold_count": 0,
        "rating_avg": 0.0,
        "rating_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })
    result = await db.products.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu cập nhật")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.products.find_one_and_update(
        {"_id": ObjectId(product_id)},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return _serialize(result)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    # Soft delete
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.get("/{product_id}/reviews", response_model=list[ReviewResponse])
async def get_reviews(product_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not ObjectId.is_valid(product_id):
        product = await db.products.find_one({"slug": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
        product_id = str(product["_id"])

    cursor = db.reviews.find({"product_id": product_id}).sort("created_at", -1)
    reviews = [_serialize(doc) async for doc in cursor]
    return reviews


@router.post("/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(
    product_id: str,
    data: ReviewCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(product_id):
        product_query = {"slug": product_id}
    else:
        product_query = {"_id": ObjectId(product_id)}

    product = await db.products.find_one({**product_query, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
        
    actual_product_id = str(product["_id"])

    # Check if user already reviewed
    existing = await db.reviews.find_one({"product_id": actual_product_id, "user_id": current_user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã đánh giá sản phẩm này rồi")

    doc = {
        "product_id": actual_product_id,
        "user_id": current_user["_id"],
        "user_name": current_user.get("full_name", "Khách"),
        "rating": data.rating,
        "comment": data.comment,
        "created_at": datetime.utcnow(),
    }
    result = await db.reviews.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    # Update product rating
    pipeline = [
        {"$match": {"product_id": actual_product_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    stats = await db.reviews.aggregate(pipeline).to_list(1)
    if stats:
        await db.products.update_one(
            {"_id": ObjectId(actual_product_id)},
            {"$set": {
                "rating_avg": round(stats[0]["avg_rating"], 1),
                "rating_count": stats[0]["count"]
            }}
        )

    return doc
