from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any
from datetime import datetime


# ─── Sub-schemas ─────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    product_id: str
    product_name: str           # Snapshot để tránh thay đổi nếu sp bị sửa
    sku: str
    variant_info: dict          # {"size": "M", "color": "Trắng"}
    quantity: int = Field(..., gt=0)
    unit_price: float
    subtotal: float             # Tính tự động: unit_price * quantity


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    street: str
    district: str
    city: str


class PaymentInfo(BaseModel):
    method: Literal["qr_vietqr", "qr_momo", "qr_zalopay", "cod"] = "qr_vietqr"
    status: Literal["pending", "paid", "failed", "refunded"] = "pending"
    amount: float
    qr_code_url: Optional[str] = None      # URL ảnh QR từ VietQR API
    qr_data_url: Optional[str] = None      # Base64 QR image (fallback)
    transaction_id: Optional[str] = None   # ID từ cổng thanh toán
    bank_transaction_no: Optional[str] = None  # Số GD ngân hàng (từ IPN)
    paid_at: Optional[datetime] = None
    webhook_payload: Optional[Any] = None  # Raw payload từ IPN để audit


# ─── Order Request/Response ───────────────────────────────────────────────────

class OrderCreate(BaseModel):
    items: List[dict]  # [{product_id, sku, quantity}]
    shipping_address: ShippingAddress
    payment_method: Literal["qr_vietqr", "qr_momo", "qr_zalopay", "cod"] = "qr_vietqr"
    notes: Optional[str] = None


class OrderInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    order_code: str             # VD: ORD-20250115-A3F7 — UNIQUE
    user_id: str
    items: List[OrderItem]
    shipping_address: ShippingAddress
    subtotal: float
    shipping_fee: float = 0.0
    discount: float = 0.0
    total_amount: float
    payment: PaymentInfo
    order_status: Literal[
        "pending_payment",
        "paid",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "refunded",
    ] = "pending_payment"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class OrderResponse(OrderInDB):
    pass


class OrderStatusUpdate(BaseModel):
    order_status: Literal[
        "pending_payment", "paid", "processing",
        "shipping", "delivered", "cancelled", "refunded"
    ]
    notes: Optional[str] = None
