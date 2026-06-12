from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import Optional
from math import ceil

from app.database import get_db
from app.models.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.middleware.auth_middleware import get_current_user, require_admin
from app.utils.helpers import generate_order_code, calculate_shipping_fee

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Tạo đơn hàng mới. Đơn hàng sẽ có status pending_payment."""
    order_items = []
    subtotal = 0.0

    for item_req in data.items:
        product = await db.products.find_one({"_id": ObjectId(item_req["product_id"])})
        if not product:
            raise HTTPException(status_code=404, detail=f"Sản phẩm {item_req['product_id']} không tồn tại")

        # Tìm variant theo SKU
        variant = next((v for v in product.get("variants", []) if v["sku"] == item_req["sku"]), None)
        if not variant:
            raise HTTPException(status_code=400, detail=f"SKU {item_req['sku']} không tồn tại")

        if variant["stock"] < item_req["quantity"]:
            raise HTTPException(status_code=400, detail=f"SKU {item_req['sku']} không đủ hàng")

        unit_price = variant["price"]
        qty = item_req["quantity"]
        subtotal_item = unit_price * qty

        order_items.append({
            "product_id": item_req["product_id"],
            "product_name": product["name"],
            "sku": item_req["sku"],
            "variant_info": {k: v for k, v in variant.items() if k not in ["sku", "price", "stock"]},
            "quantity": qty,
            "unit_price": unit_price,
            "subtotal": subtotal_item,
        })
        subtotal += subtotal_item

        # Trừ tồn kho
        await db.products.update_one(
            {"_id": ObjectId(item_req["product_id"]), "variants.sku": item_req["sku"]},
            {"$inc": {"variants.$.stock": -qty, "sold_count": qty}},
        )

    shipping_fee = calculate_shipping_fee(data.shipping_address.city, subtotal)
    total_amount = subtotal + shipping_fee

    # Tạo mã đơn hàng duy nhất (retry nếu trùng)
    for _ in range(5):
        order_code = generate_order_code()
        existing = await db.orders.find_one({"order_code": order_code})
        if not existing:
            break

    order_doc = {
        "order_code": order_code,
        "user_id": current_user["_id"],
        "items": order_items,
        "shipping_address": data.shipping_address.model_dump(),
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "discount": 0.0,
        "total_amount": total_amount,
        "payment": {
            "method": data.payment_method,
            "status": "pending",
            "amount": total_amount,
            "qr_code_url": None,
            "qr_data_url": None,
            "transaction_id": None,
            "bank_transaction_no": None,
            "paid_at": None,
            "webhook_payload": None,
        },
        "order_status": "pending_payment",
        "notes": data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = str(result.inserted_id)
    return order_doc


@router.get("", response_model=dict)
async def list_my_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    query = {"user_id": current_user["_id"]}
    total = await db.orders.count_documents(query)
    skip = (page - 1) * page_size
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    items = [_serialize(doc) async for doc in cursor]
    return {
        "items": items,
        "total": total,
        "page": page,
        "total_pages": ceil(total / page_size) if total else 1,
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Tìm theo _id hoặc order_code
    query = (
        {"order_code": order_id}
        if not ObjectId.is_valid(order_id)
        else {"_id": ObjectId(order_id)}
    )
    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    if str(order["user_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đơn hàng này")
    return _serialize(order)


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    if str(order["user_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Không có quyền")
    if order["order_status"] not in ["pending_payment", "paid"]:
        raise HTTPException(status_code=400, detail="Không thể huỷ đơn hàng ở trạng thái này")

    result = await db.orders.find_one_and_update(
        {"_id": ObjectId(order_id)},
        {"$set": {"order_status": "cancelled", "updated_at": datetime.utcnow()}},
        return_document=True,
    )

    # Hoàn lại tồn kho cho từng item trong đơn hàng
    for item in order.get("items", []):
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"]), "variants.sku": item["sku"]},
            {"$inc": {"variants.$.stock": item["quantity"], "sold_count": -item["quantity"]}},
        )

    return _serialize(result)


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = (
        {"order_code": order_id}
        if not ObjectId.is_valid(order_id)
        else {"_id": ObjectId(order_id)}
    )
    order = await db.orders.find_one(query)
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    if str(order["user_id"]) != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền")
    if order["order_status"] != "cancelled":
        raise HTTPException(status_code=400, detail="Chỉ có thể xoá đơn hàng đã bị huỷ")

    await db.orders.delete_one({"_id": order["_id"]})
    return {"message": "Đã xoá đơn hàng thành công"}


# ── Admin only ────────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=dict)
async def admin_list_orders(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    query = {}
    if status:
        query["order_status"] = status
    total = await db.orders.count_documents(query)
    skip = (page - 1) * page_size
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    items = [_serialize(doc) async for doc in cursor]
    return {"items": items, "total": total, "page": page}


@router.patch("/admin/{order_id}/status", response_model=OrderResponse)
async def admin_update_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    result = await db.orders.find_one_and_update(
        {"_id": ObjectId(order_id)},
        {"$set": {"order_status": data.order_status, "updated_at": datetime.utcnow()}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return _serialize(result)
