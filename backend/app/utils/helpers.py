import random
import string
from datetime import datetime


def generate_order_code() -> str:
    """
    Tạo mã đơn hàng duy nhất theo format: ORD-YYYYMMDD-XXXX
    VD: ORD-20250115-A3F7
    Mã này được dùng làm nội dung chuyển khoản trong QR.
    """
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ORD-{date_str}-{random_suffix}"


def format_currency(amount: float) -> str:
    """Format số tiền VND: 530000 -> '530,000 VND'"""
    return f"{amount:,.0f} VND"


def slugify(text: str) -> str:
    """Tạo slug từ tên sản phẩm (cơ bản, không dấu)"""
    import unicodedata
    import re
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


def calculate_shipping_fee(city: str, subtotal: float) -> float:
    """
    Logic tính phí ship đơn giản.
    Thay bằng API GHN/GHTK trong production.
    """
    if subtotal >= 500_000:
        return 0.0          # Miễn phí ship đơn trên 500k
    if city in ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"]:
        return 20_000.0
    return 35_000.0
