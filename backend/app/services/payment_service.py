"""
payment_service.py
==================
Xử lý toàn bộ logic tạo QR và giao tiếp với cổng thanh toán.

Hỗ trợ:
  1. VietQR  — Miễn phí, không cần merchant account
  2. MoMo    — Cần merchant account (sandbox available)
  3. ZaloPay — Cần merchant account (sandbox available)
"""

import hashlib
import hmac
import json
import time
import uuid
import httpx
import qrcode
import base64
from io import BytesIO
from datetime import datetime
from typing import Optional
from app.config import get_settings

settings = get_settings()

# ─────────────────────────────────────────────────────────────────────────────
# VIETQR  (Ưu tiên — Miễn phí, theo chuẩn NAPAS/VietQR)
# Docs: https://vietqr.io/danh-sach-api/
# ─────────────────────────────────────────────────────────────────────────────

VIETQR_API_BASE = "https://api.vietqr.io/v2"


async def create_vietqr(
    order_code: str,
    amount: float,
    description: Optional[str] = None,
) -> dict:
    """
    Gọi VietQR API để tạo QR image URL.

    Returns:
        {
            "qr_code_url": "https://img.vietqr.io/...",
            "qr_data_url": "<base64 fallback>",
        }
    """
    # Nội dung chuyển khoản = mã đơn hàng (để webhook nhận diện)
    transfer_content = description or order_code

    # Cách 1: Dùng URL trực tiếp (không cần API key, miễn phí hoàn toàn)
    # Format: https://img.vietqr.io/image/{bank_id}-{account_no}-{template}.png
    #         ?amount={amount}&addInfo={content}&accountName={name}
    qr_url = (
        f"https://img.vietqr.io/image/"
        f"{settings.vietqr_bank_id}-{settings.vietqr_account_no}"
        f"-{settings.vietqr_template}.png"
        f"?amount={int(amount)}"
        f"&addInfo={transfer_content}"
        f"&accountName={settings.vietqr_account_name.replace(' ', '%20')}"
    )

    # Cách 2: Dùng VietQR Pro API (nếu có API key — nhiều tuỳ chọn hơn)
    if settings.vietqr_client_id and settings.vietqr_api_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{VIETQR_API_BASE}/generate",
                    headers={
                        "x-client-id": settings.vietqr_client_id,
                        "x-api-key": settings.vietqr_api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "accountNo": settings.vietqr_account_no,
                        "accountName": settings.vietqr_account_name,
                        "acqId": _get_bank_acq_id(settings.vietqr_bank_id),
                        "amount": int(amount),
                        "addInfo": transfer_content,
                        "format": "text",
                        "template": settings.vietqr_template,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "00":
                        qr_url = data["data"]["qrDataURL"]  # Base64 PNG
        except Exception as e:
            print(f"⚠️ VietQR Pro API lỗi, dùng URL fallback: {e}")

    # Tạo QR local làm backup (nếu cần)
    qr_data_url = _generate_qr_local(qr_url, amount, transfer_content)

    return {
        "qr_code_url": qr_url,
        "qr_data_url": qr_data_url,
        "bank_id": settings.vietqr_bank_id,
        "account_no": settings.vietqr_account_no,
        "account_name": settings.vietqr_account_name,
        "amount": amount,
        "transfer_content": transfer_content,
    }


def _get_bank_acq_id(bank_id: str) -> int:
    """Map bank code -> acquirer ID cho VietQR Pro API"""
    bank_map = {
        "VCB": 970436,  # Vietcombank
        "MB": 970422,   # MB Bank
        "TCB": 970407,  # Techcombank
        "VTB": 970415,  # Vietinbank
        "BIDV": 970418,
        "ACB": 970416,
        "TPB": 970423,  # TPBank
        "VPB": 970432,  # VPBank
        "MSB": 970426,
        "OCB": 970448,
    }
    return bank_map.get(bank_id.upper(), 970422)  # Default: MB


def _generate_qr_local(url: str, amount: float, content: str) -> str:
    """
    Tạo QR code local bằng thư viện qrcode.
    Encode toàn bộ VietQR URL thành QR image base64.
    """
    try:
        qr = qrcode.QRCode(version=1, box_size=8, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode("utf-8")
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        print(f"⚠️ Không tạo được QR local: {e}")
        return ""


# ─────────────────────────────────────────────────────────────────────────────
# MOMO (Tích hợp đầy đủ với sandbox)
# Docs: https://developers.momo.vn/v3/docs/payment/api/payment-method/
# ─────────────────────────────────────────────────────────────────────────────

async def create_momo_payment(
    order_code: str,
    amount: float,
    order_info: str = "",
) -> dict:
    """
    Tạo yêu cầu thanh toán MoMo (QR Code flow).

    Returns dict chứa payUrl và deeplink để frontend hiển thị QR.
    """
    if not settings.momo_partner_code:
        raise ValueError("Chưa cấu hình MoMo credentials trong .env")

    request_id = f"{order_code}-{int(time.time())}"
    order_info = order_info or f"Thanh toán đơn hàng {order_code}"
    extra_data = ""

    # Tạo raw signature string theo thứ tự bắt buộc của MoMo
    raw_signature = (
        f"accessKey={settings.momo_access_key}"
        f"&amount={int(amount)}"
        f"&extraData={extra_data}"
        f"&ipnUrl={settings.momo_ipn_url}"
        f"&orderId={order_code}"
        f"&orderInfo={order_info}"
        f"&partnerCode={settings.momo_partner_code}"
        f"&redirectUrl={settings.momo_redirect_url}"
        f"&requestId={request_id}"
        f"&requestType=payWithMethod"
    )

    # Ký HMAC-SHA256
    signature = hmac.new(
        settings.momo_secret_key.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    payload = {
        "partnerCode": settings.momo_partner_code,
        "partnerName": "Shop QR",
        "storeId": settings.momo_partner_code,
        "requestId": request_id,
        "amount": int(amount),
        "orderId": order_code,
        "orderInfo": order_info,
        "redirectUrl": settings.momo_redirect_url,
        "ipnUrl": settings.momo_ipn_url,
        "lang": "vi",
        "requestType": "payWithMethod",
        "autoCapture": True,
        "extraData": extra_data,
        "orderGroupId": "",
        "signature": signature,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            settings.momo_endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        result = response.json()

    if result.get("resultCode") != 0:
        raise ValueError(f"MoMo error: {result.get('message')}")

    return {
        "pay_url": result.get("payUrl"),
        "deeplink": result.get("deeplink"),
        "qr_code_url": result.get("qrCodeUrl"),
        "request_id": request_id,
        "order_id": order_code,
    }


def verify_momo_ipn(data: dict) -> bool:
    """
    Verify chữ ký HMAC từ IPN callback của MoMo.
    PHẢI verify trước khi xử lý bất kỳ thay đổi nào.
    """
    received_signature = data.get("signature", "")

    raw_signature = (
        f"accessKey={settings.momo_access_key}"
        f"&amount={data.get('amount')}"
        f"&extraData={data.get('extraData', '')}"
        f"&message={data.get('message')}"
        f"&orderId={data.get('orderId')}"
        f"&orderInfo={data.get('orderInfo')}"
        f"&orderType={data.get('orderType')}"
        f"&partnerCode={data.get('partnerCode')}"
        f"&payType={data.get('payType')}"
        f"&requestId={data.get('requestId')}"
        f"&responseTime={data.get('responseTime')}"
        f"&resultCode={data.get('resultCode')}"
        f"&transId={data.get('transId')}"
    )

    expected_signature = hmac.new(
        settings.momo_secret_key.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(received_signature, expected_signature)


# ─────────────────────────────────────────────────────────────────────────────
# ZALOPAY (Tích hợp đầy đủ với sandbox)
# Docs: https://docs.zalopay.vn/v2/
# ─────────────────────────────────────────────────────────────────────────────

async def create_zalopay_payment(
    order_code: str,
    amount: float,
    description: str = "",
) -> dict:
    """Tạo yêu cầu thanh toán ZaloPay."""
    if not settings.zalopay_app_id:
        raise ValueError("Chưa cấu hình ZaloPay credentials trong .env")

    trans_id = datetime.now().strftime("%y%m%d") + "_" + order_code
    app_time = int(round(time.time() * 1000))

    order = {
        "app_id": int(settings.zalopay_app_id),
        "app_trans_id": trans_id,
        "app_user": "customer",
        "app_time": app_time,
        "item": json.dumps([]),
        "embed_data": json.dumps({"redirecturl": settings.frontend_url + "/orders"}),
        "amount": int(amount),
        "callback_url": settings.zalopay_callback_url,
        "description": description or f"Thanh toán đơn hàng {order_code}",
        "bank_code": "",
    }

    # Tạo MAC signature
    data = (
        f"{order['app_id']}|{order['app_trans_id']}|{order['app_user']}"
        f"|{order['amount']}|{order['app_time']}|{order['embed_data']}|{order['item']}"
    )
    order["mac"] = hmac.new(
        settings.zalopay_key1.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(settings.zalopay_endpoint, data=order)
        response.raise_for_status()
        result = response.json()

    if result.get("return_code") != 1:
        raise ValueError(f"ZaloPay error: {result.get('return_message')}")

    return {
        "order_url": result.get("order_url"),
        "qr_code": result.get("zp_trans_token"),
        "trans_id": trans_id,
    }


def verify_zalopay_callback(data: str, request_mac: str) -> bool:
    """Verify MAC từ ZaloPay callback."""
    mac = hmac.new(
        settings.zalopay_key2.encode(),
        data.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(mac, request_mac)
