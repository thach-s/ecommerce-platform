"""
payment.py router
==================
POST /api/payment/create-qr   — Tạo QR Code cho đơn hàng
GET  /api/payment/banks        — Lấy danh sách ngân hàng VietQR
WS   /ws/orders/{order_code}   — WebSocket endpoint để theo dõi trạng thái
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from typing import Literal, Optional
import httpx

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.services.payment_service import create_vietqr, create_momo_payment, create_zalopay_payment
from app.services.notification_service import manager
from app.utils.helpers import generate_order_code, calculate_shipping_fee

router = APIRouter(prefix="/api/payment", tags=["Payment"])
ws_router = APIRouter(tags=["WebSocket"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class CreateQRRequest(BaseModel):
    order_id: str                       # MongoDB _id của đơn hàng đã tạo
    payment_method: Literal["qr_vietqr", "qr_momo", "qr_zalopay"] = "qr_vietqr"


class QRResponse(BaseModel):
    order_code: str
    total_amount: float
    payment_method: str
    # VietQR fields
    qr_code_url: Optional[str] = None
    qr_data_url: Optional[str] = None   # Base64 fallback
    account_no: Optional[str] = None
    account_name: Optional[str] = None
    bank_id: Optional[str] = None
    transfer_content: Optional[str] = None
    # MoMo / ZaloPay fields
    pay_url: Optional[str] = None
    deeplink: Optional[str] = None
    expires_in: int = 900               # QR hết hạn sau 15 phút


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/create-qr", response_model=QRResponse)
async def create_payment_qr(
    request: CreateQRRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Tạo QR Code thanh toán cho đơn hàng.

    Flow:
      1. Xác thực đơn hàng thuộc về current_user
      2. Kiểm tra đơn hàng chưa được thanh toán
      3. Gọi payment_service tạo QR
      4. Lưu QR URL vào order.payment trong DB
      5. Trả về thông tin QR cho frontend hiển thị
    """
    # 1. Lấy đơn hàng từ DB
    try:
        order = await db.orders.find_one({"_id": ObjectId(request.order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Order ID không hợp lệ")

    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    # 2. Kiểm tra quyền sở hữu
    if str(order["user_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập đơn hàng này")

    # 3. Kiểm tra trạng thái
    if order["payment"]["status"] == "paid":
        raise HTTPException(status_code=400, detail="Đơn hàng này đã được thanh toán")

    order_code = order["order_code"]
    total_amount = order["total_amount"]

    # 4. Tạo QR theo phương thức thanh toán
    qr_info = {}

    try:
        if request.payment_method == "qr_vietqr":
            qr_info = await create_vietqr(
                order_code=order_code,
                amount=total_amount,
                description=order_code,
            )
        elif request.payment_method == "qr_momo":
            qr_info = await create_momo_payment(
                order_code=order_code,
                amount=total_amount,
                order_info=f"Thanh toán đơn hàng {order_code}",
            )
        elif request.payment_method == "qr_zalopay":
            qr_info = await create_zalopay_payment(
                order_code=order_code,
                amount=total_amount,
                description=f"Thanh toán đơn hàng {order_code}",
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 5. Cập nhật thông tin QR vào DB
    update_data = {
        "payment.method": request.payment_method,
        "payment.qr_code_url": qr_info.get("qr_code_url") or qr_info.get("pay_url"),
        "payment.qr_data_url": qr_info.get("qr_data_url", ""),
        "updated_at": datetime.utcnow(),
    }
    await db.orders.update_one(
        {"_id": ObjectId(request.order_id)},
        {"$set": update_data},
    )

    return QRResponse(
        order_code=order_code,
        total_amount=total_amount,
        payment_method=request.payment_method,
        # VietQR
        qr_code_url=qr_info.get("qr_code_url"),
        qr_data_url=qr_info.get("qr_data_url"),
        account_no=qr_info.get("account_no"),
        account_name=qr_info.get("account_name"),
        bank_id=qr_info.get("bank_id"),
        transfer_content=qr_info.get("transfer_content"),
        # MoMo / ZaloPay
        pay_url=qr_info.get("pay_url") or qr_info.get("order_url"),
        deeplink=qr_info.get("deeplink"),
    )


@router.get("/banks")
async def get_vietqr_banks():
    """Lấy danh sách ngân hàng hỗ trợ VietQR."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get("https://api.vietqr.io/v2/banks")
        if response.status_code == 200:
            return response.json()
    return {"data": [], "message": "Không thể lấy danh sách ngân hàng"}


# ─── WebSocket: Theo dõi trạng thái thanh toán realtime ──────────────────────

@ws_router.websocket("/ws/orders/{order_code}")
async def websocket_order_status(
    websocket: WebSocket,
    order_code: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    WebSocket endpoint để client lắng nghe trạng thái thanh toán.

    Client kết nối ngay sau khi hiển thị QR:
      ws://localhost:8000/ws/orders/ORD-20250115-A3F7

    Khi webhook xác nhận thanh toán, server sẽ push message qua đây.
    Frontend nhận message và cập nhật UI ngay lập tức.
    """
    await manager.connect(websocket, order_code)
    try:
        # Gửi trạng thái hiện tại ngay khi kết nối
        order = await db.orders.find_one({"order_code": order_code})
        if order:
            await websocket.send_json({
                "event": "connected",
                "order_code": order_code,
                "order_status": order["order_status"],
                "payment_status": order["payment"]["status"],
                "message": "Đang chờ xác nhận thanh toán...",
            })

        # Giữ kết nối, xử lý ping/pong hoặc client messages
        while True:
            try:
                data = await websocket.receive_text()
                # Client có thể gửi "ping" để giữ kết nối
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, order_code)
