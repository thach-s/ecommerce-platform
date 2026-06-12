"""
webhook.py router
==================
Xử lý IPN (Instant Payment Notification) từ các cổng thanh toán.

Endpoints:
  POST /api/webhook/vietqr    — Nhận callback từ VietQR / Ngân hàng
  POST /api/webhook/momo      — Nhận IPN từ MoMo
  POST /api/webhook/zalopay   — Nhận callback từ ZaloPay
  POST /api/webhook/simulate  — Giả lập thanh toán để test (dev only)

Luồng xử lý:
  1. Nhận request từ cổng thanh toán
  2. Verify chữ ký (HMAC) — BẮT BUỘC để tránh giả mạo
  3. Kiểm tra kết quả giao dịch (success/fail)
  4. Tìm đơn hàng trong DB theo order_code
  5. Cập nhật trạng thái payment và order_status
  6. Push WebSocket notification đến client
  7. Trả về HTTP 200 để cổng thanh toán biết đã nhận
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.config import get_settings
from app.services.payment_service import verify_momo_ipn, verify_zalopay_callback
from app.services.notification_service import manager

router = APIRouter(prefix="/api/webhook", tags=["Webhook"])
settings = get_settings()
logger = logging.getLogger(__name__)


# ─── Helper ───────────────────────────────────────────────────────────────────

async def _update_order_paid(
    db: AsyncIOMotorDatabase,
    order_code: str,
    transaction_id: str,
    bank_transaction_no: Optional[str],
    webhook_payload: dict,
    background_tasks: BackgroundTasks,
):
    """
    Cập nhật đơn hàng thành 'paid' và push WebSocket notification.
    Chạy trong background task để webhook có thể trả 200 nhanh nhất.
    """
    now = datetime.utcnow()
    result = await db.orders.find_one_and_update(
        {
            "order_code": order_code,
            "payment.status": "pending",   # Idempotent: chỉ xử lý 1 lần
        },
        {
            "$set": {
                "order_status": "paid",
                "payment.status": "paid",
                "payment.transaction_id": transaction_id,
                "payment.bank_transaction_no": bank_transaction_no,
                "payment.paid_at": now,
                "payment.webhook_payload": webhook_payload,
                "updated_at": now,
            }
        },
        return_document=True,  # Trả về document sau khi update
    )

    if result:
        logger.info(f"✅ Order {order_code} đã thanh toán thành công (tx: {transaction_id})")
        # Push WebSocket đến client đang xem trang thanh toán
        order_data = {
            "order_code": result["order_code"],
            "total_amount": result["total_amount"],
            "paid_at": now.isoformat(),
        }
        await manager.broadcast_payment_success(order_code, order_data)
    else:
        # Order không tìm thấy hoặc đã được xử lý rồi (duplicate webhook)
        logger.warning(f"⚠️ Duplicate webhook hoặc không tìm thấy order: {order_code}")


async def _update_order_failed(
    db: AsyncIOMotorDatabase,
    order_code: str,
    webhook_payload: dict,
):
    """Cập nhật đơn hàng thành failed và thông báo client."""
    await db.orders.update_one(
        {"order_code": order_code, "payment.status": "pending"},
        {
            "$set": {
                "payment.status": "failed",
                "payment.webhook_payload": webhook_payload,
                "updated_at": datetime.utcnow(),
            }
        },
    )
    await manager.broadcast_payment_failed(order_code)
    logger.warning(f"❌ Order {order_code} thanh toán thất bại")


# ─── VietQR / Bank Transfer Webhook ──────────────────────────────────────────

@router.post("/vietqr")
async def vietqr_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Nhận IPN từ VietQR hoặc tích hợp ngân hàng trực tiếp.

    Lưu ý: VietQR free tier KHÔNG có webhook — bạn cần:
      a) Dùng VietQR Pro / dịch vụ ngân hàng mở (MB OpenAPI, VCB API...)
      b) Hoặc tích hợp qua Sepay / Casso (aggregator có webhook miễn phí)
      c) Hoặc dùng polling (GET /api/orders/{id}/status) làm fallback

    Endpoint này xử lý format IPN của Sepay/Casso (phổ biến nhất khi dev).
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"📩 VietQR webhook received: {json.dumps(payload, ensure_ascii=False)}")

    # ── Verify API key từ header (Sepay/Casso gửi token trong header) ──────
    api_key = request.headers.get("Authorization", "").replace("Bearer ", "")
    if api_key != settings.webhook_secret:
        logger.warning(f"🚨 Webhook: Invalid API key")
        raise HTTPException(status_code=401, detail="Unauthorized")

    # ── Parse payload (format Sepay) ────────────────────────────────────────
    # Sepay payload: {"id", "gateway", "transactionDate", "accountNumber",
    #                 "code", "content", "transferAmount", "description",
    #                 "referenceCode", "transferType"}
    transfer_amount = payload.get("transferAmount", 0)
    content = payload.get("content", "")         # Nội dung chuyển khoản
    transaction_code = payload.get("referenceCode", "")
    transfer_type = payload.get("transferType", "")

    if transfer_type != "in":  # Chỉ xử lý tiền đến (in), bỏ qua tiền đi (out)
        return JSONResponse({"success": True, "message": "Skipped outbound transfer"})

    # ── Tìm order_code trong nội dung chuyển khoản ───────────────────────────
    # Nội dung: "ORD-20250115-A3F7" hoặc "Thanh toan ORD-20250115-A3F7"
    import re
    match = re.search(r"ORD-\d{8}-[A-Z0-9]{4}", content.upper())
    if not match:
        logger.info(f"ℹ️ Không tìm thấy order code trong nội dung: {content}")
        return JSONResponse({"success": True, "message": "No matching order"})

    order_code = match.group(0)

    # ── Kiểm tra số tiền khớp ────────────────────────────────────────────────
    order = await db.orders.find_one({"order_code": order_code})
    if not order:
        return JSONResponse({"success": True, "message": "Order not found"})

    expected_amount = order["total_amount"]
    if abs(transfer_amount - expected_amount) > 1000:   # Sai lệch cho phép 1000đ
        logger.warning(
            f"⚠️ Số tiền không khớp: expected={expected_amount}, received={transfer_amount}"
        )
        return JSONResponse({"success": False, "message": "Amount mismatch"})

    # ── Cập nhật DB và push WebSocket (background để trả 200 nhanh) ─────────
    background_tasks.add_task(
        _update_order_paid,
        db=db,
        order_code=order_code,
        transaction_id=transaction_code,
        bank_transaction_no=payload.get("id"),
        webhook_payload=payload,
        background_tasks=background_tasks,
    )

    return JSONResponse({"success": True, "message": "Processed"})


# ─── MoMo IPN ─────────────────────────────────────────────────────────────────

@router.post("/momo")
async def momo_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Nhận IPN từ MoMo.
    MoMo gửi POST request với JSON body và chữ ký HMAC-SHA256.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    logger.info(f"📩 MoMo IPN: orderId={payload.get('orderId')}, resultCode={payload.get('resultCode')}")

    # ── 1. Verify chữ ký HMAC ────────────────────────────────────────────────
    if not verify_momo_ipn(payload):
        logger.warning("🚨 MoMo IPN: Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    order_code = payload.get("orderId", "")
    result_code = payload.get("resultCode", -1)
    transaction_id = str(payload.get("transId", ""))

    # ── 2. Xử lý kết quả ─────────────────────────────────────────────────────
    if result_code == 0:  # 0 = thành công
        background_tasks.add_task(
            _update_order_paid,
            db=db,
            order_code=order_code,
            transaction_id=transaction_id,
            bank_transaction_no=None,
            webhook_payload=payload,
            background_tasks=background_tasks,
        )
    else:
        background_tasks.add_task(
            _update_order_failed,
            db=db,
            order_code=order_code,
            webhook_payload=payload,
        )

    # MoMo yêu cầu trả về 200 với body cụ thể
    return JSONResponse({
        "partnerCode": payload.get("partnerCode"),
        "requestId": payload.get("requestId"),
        "orderId": order_code,
        "resultCode": 0,
        "message": "Received",
    })


# ─── ZaloPay Callback ─────────────────────────────────────────────────────────

@router.post("/zalopay")
async def zalopay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Nhận callback từ ZaloPay.
    ZaloPay gửi POST với form data: {data, mac, type}
    """
    try:
        form = await request.form()
        data_str = form.get("data", "")
        received_mac = form.get("mac", "")
        cb_type = int(form.get("type", 1))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid form data")

    logger.info(f"📩 ZaloPay callback: type={cb_type}")

    # ── 1. Verify MAC ─────────────────────────────────────────────────────────
    if not verify_zalopay_callback(data_str, received_mac):
        logger.warning("🚨 ZaloPay: Invalid MAC")
        return JSONResponse({"return_code": -1, "return_message": "MAC not equal"})

    data = json.loads(data_str)
    embed_data = json.loads(data.get("embed_data", "{}"))
    app_trans_id = data.get("app_trans_id", "")

    # Tìm order_code từ app_trans_id (format: "250115_ORD-20250115-A3F7")
    import re
    match = re.search(r"ORD-\d{8}-[A-Z0-9]{4}", app_trans_id.upper())
    if not match:
        return JSONResponse({"return_code": 1, "return_message": "OK"})

    order_code = match.group(0)

    # ── 2. Xử lý ─────────────────────────────────────────────────────────────
    if cb_type == 1:  # Thanh toán thành công
        background_tasks.add_task(
            _update_order_paid,
            db=db,
            order_code=order_code,
            transaction_id=str(data.get("zp_trans_id")),
            bank_transaction_no=None,
            webhook_payload=data,
            background_tasks=background_tasks,
        )
    
    return JSONResponse({"return_code": 1, "return_message": "Success"})


# ─── Simulate Webhook (Development Only) ──────────────────────────────────────

class SimulatePaymentRequest(BaseModel):
    order_code: str
    success: bool = True


@router.post("/simulate", include_in_schema=True)
async def simulate_payment(
    request_body: SimulatePaymentRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    ⚠️ CHỈ DÙNG KHI DEVELOPMENT — Giả lập nhận IPN thanh toán.
    
    Dùng để test luồng QR mà không cần cổng thanh toán thật.
    Gọi API này sau khi tạo QR để xem WebSocket notification hoạt động.
    
    PHẢI TẮT endpoint này trên production!
    """
    if settings.environment != "development":
        raise HTTPException(status_code=403, detail="Chỉ khả dụng trong môi trường development")

    if request_body.success:
        background_tasks.add_task(
            _update_order_paid,
            db=db,
            order_code=request_body.order_code,
            transaction_id=f"SIMULATED-{datetime.utcnow().timestamp()}",
            bank_transaction_no="SIM-12345",
            webhook_payload={"simulated": True, "order_code": request_body.order_code},
            background_tasks=background_tasks,
        )
        return {"message": f"✅ Đã giả lập thanh toán thành công cho {request_body.order_code}"}
    else:
        background_tasks.add_task(
            _update_order_failed,
            db=db,
            order_code=request_body.order_code,
            webhook_payload={"simulated": True, "failed": True},
        )
        return {"message": f"❌ Đã giả lập thanh toán thất bại cho {request_body.order_code}"}
