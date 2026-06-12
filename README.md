# 🛒 E-Commerce QR Payment

Hệ thống thương mại điện tử hoàn chỉnh với thanh toán QR Code động (VietQR / MoMo / ZaloPay).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Python FastAPI + Motor (async) |
| Database | MongoDB Atlas |
| Realtime | WebSocket (FastAPI native) |
| QR Payment | VietQR (free) / MoMo / ZaloPay |

## Cấu Trúc Dự Án

```
ecommerce-qr/
├── backend/          # FastAPI
│   ├── main.py
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/   {user, product, order}
│   │   ├── routers/  {auth, products, orders, payment, webhook}
│   │   ├── services/ {auth, payment, notification}
│   │   └── middleware/
│   └── requirements.txt
└── frontend/         # Next.js 14
    └── src/
        ├── app/      {auth, products, cart, checkout, orders, admin}
        ├── components/
        │   └── checkout/QRPaymentModal.tsx  ⭐
        ├── hooks/usePaymentStatus.ts
        └── store/    {authStore, cartStore}
```

## 🚀 Cài Đặt và Chạy Local

### Yêu cầu

- Ubuntu 20.04+
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (miễn phí)

---

### 1. Clone & Cấu hình

```bash
git clone <your-repo-url>
cd ecommerce-qr
```

### 2. Setup Backend

```bash
cd backend

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env: điền MONGODB_URL, JWT_SECRET_KEY, VIETQR_ACCOUNT_NO, ...

# Chạy server
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Setup Frontend

```bash
cd frontend

# Cài Node.js nếu chưa có
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.local.example .env.local

# Chạy dev server
npm run dev
```

Frontend: http://localhost:3000

---

## 🔄 Luồng Thanh Toán QR

```
Khách hàng                 Frontend                Backend              VietQR/MoMo
     │                         │                       │                      │
     │──── Đặt hàng ──────────>│                       │                      │
     │                         │──POST /api/orders ───>│                      │
     │                         │<── {order_id} ────────│                      │
     │                         │──POST /payment/qr ───>│──── Gọi API ─────────>│
     │                         │                       │<─── QR URL ──────────│
     │                         │<── {qr_code_url} ─────│                      │
     │<── Hiển thị QR ─────────│                       │                      │
     │                         │── WS connect ────────>│                      │
     │──── Quét QR & chuyển khoản ─────────────────────────────────────────>  │
     │                         │                       │<── IPN Webhook ──────│
     │                         │                       │── Verify signature   │
     │                         │                       │── Update DB: "paid"  │
     │                         │<── WS push "paid" ────│                      │
     │<── UI cập nhật ngay ────│                       │                      │
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Thông tin user |

### Products
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm (filter, search, paginate) |
| GET | `/api/products/{id}` | Chi tiết sản phẩm |
| POST | `/api/products` | Tạo sản phẩm (admin) |
| PUT | `/api/products/{id}` | Cập nhật (admin) |
| DELETE | `/api/products/{id}` | Xoá (admin) |

### Orders
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders` | Đơn hàng của tôi |
| GET | `/api/orders/{id}` | Chi tiết đơn hàng |
| PATCH | `/api/orders/{id}/cancel` | Huỷ đơn |

### Payment ⭐
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/payment/create-qr` | Tạo QR Code |
| GET | `/api/payment/banks` | Danh sách ngân hàng VietQR |
| WS | `/ws/orders/{order_code}` | Real-time payment status |

### Webhooks
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/webhook/vietqr` | IPN từ VietQR/Sepay |
| POST | `/api/webhook/momo` | IPN từ MoMo |
| POST | `/api/webhook/zalopay` | Callback từ ZaloPay |
| POST | `/api/webhook/simulate` | Giả lập (dev only) |

## 🧪 Test Webhook Local

1. Cài ngrok:
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
ngrok config add-authtoken <your-token>
```

2. Expose backend:
```bash
ngrok http 8000
# Copy URL dạng: https://xxxx.ngrok-free.app
```

3. Cập nhật `BACKEND_URL` trong `.env` và khởi động lại backend.

4. Giả lập thanh toán (trong development):
```bash
curl -X POST http://localhost:8000/api/webhook/simulate \
  -H "Content-Type: application/json" \
  -d '{"order_code": "ORD-20250115-A3F7", "success": true}'
```

## 🔐 Biến Môi Trường Quan Trọng

Xem chi tiết trong `backend/.env.example`

- `MONGODB_URL` — MongoDB Atlas connection string
- `JWT_SECRET_KEY` — Secret key cho JWT (≥32 ký tự)
- `VIETQR_BANK_ID` — Mã ngân hàng (VD: MB, VCB, TCB)
- `VIETQR_ACCOUNT_NO` — Số tài khoản nhận tiền
- `WEBHOOK_SECRET` — Secret để verify IPN

## 📦 Cài Node.js nếu chưa có

```bash
# Cách 1: NodeSource (khuyên dùng)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cách 2: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
```
