"""
admin.py router
================
GET /api/admin/stats  — Thống kê tổng quan cho Admin Dashboard
"""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from app.database import get_db
from app.middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Trả về số liệu tổng quan cho dashboard admin."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Tổng đơn hàng hôm nay
    orders_today = await db.orders.count_documents({
        "created_at": {"$gte": today_start}
    })

    # Tổng đơn hàng tháng này
    orders_month = await db.orders.count_documents({
        "created_at": {"$gte": month_start}
    })

    # Đơn chờ xử lý (pending_payment hoặc paid nhưng chưa processing)
    orders_pending = await db.orders.count_documents({
        "order_status": {"$in": ["pending_payment", "paid"]}
    })

    # Tổng doanh thu (chỉ đơn đã thanh toán)
    revenue_pipeline = [
        {"$match": {"payment.status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    # Doanh thu tháng này
    revenue_month_pipeline = [
        {"$match": {"payment.status": "paid", "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ]
    rev_month_result = await db.orders.aggregate(revenue_month_pipeline).to_list(1)
    revenue_month = rev_month_result[0]["total"] if rev_month_result else 0

    # Top 5 sản phẩm bán chạy
    top_products = await db.products.find(
        {"is_active": True},
        {"name": 1, "images": 1, "base_price": 1, "sold_count": 1, "category": 1}
    ).sort("sold_count", -1).limit(5).to_list(5)

    for p in top_products:
        p["_id"] = str(p["_id"])

    # Tổng sản phẩm đang hoạt động
    total_products = await db.products.count_documents({"is_active": True})

    # Tổng người dùng
    total_users = await db.users.count_documents({"role": "customer"})

    return {
        "orders_today": orders_today,
        "orders_month": orders_month,
        "orders_pending": orders_pending,
        "total_revenue": total_revenue,
        "revenue_month": revenue_month,
        "top_products": top_products,
        "total_products": total_products,
        "total_users": total_users,
    }


@router.get("/charts")
async def get_admin_charts(
    time_range: str = "7d",
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
):
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    
    if time_range == "24h":
        start_date = now - timedelta(hours=24)
    elif time_range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)
        
    orders = await db.orders.find({
        "payment.status": "paid",
        "created_at": {"$gte": start_date}
    }).to_list(None)
    
    revenue_dict = {}
    visits_dict = {} # mock visits since we don't track visits
    
    if time_range == "24h":
        # group by hour
        for i in range(25):
            h = (now - timedelta(hours=24 - i)).strftime("%H:00")
            revenue_dict[h] = 0
            visits_dict[h] = 10 + (i * 2) # Mock visits
        for o in orders:
            h = o["created_at"].strftime("%H:00")
            if h in revenue_dict:
                revenue_dict[h] += o.get("total_amount", 0)
    elif time_range == "30d":
        # group by day
        for i in range(30):
            d = (now - timedelta(days=29 - i)).strftime("%d/%m")
            revenue_dict[d] = 0
            visits_dict[d] = 150 + (i * 5) # Mock visits
        for o in orders:
            d = o["created_at"].strftime("%d/%m")
            if d in revenue_dict:
                revenue_dict[d] += o.get("total_amount", 0)
    else: # 7d
        # group by day
        for i in range(7):
            d = (now - timedelta(days=6 - i)).strftime("%d/%m")
            revenue_dict[d] = 0
            visits_dict[d] = 120 + (i * 10) # Mock visits
        for o in orders:
            d = o["created_at"].strftime("%d/%m")
            if d in revenue_dict:
                revenue_dict[d] += o.get("total_amount", 0)

    revenue_list = [{"name": k, "total": v} for k, v in revenue_dict.items()]
    visits_list = [{"name": k, "visitors": v} for k, v in visits_dict.items()]
    
    return {
        "revenue": revenue_list,
        "visits": visits_list
    }
