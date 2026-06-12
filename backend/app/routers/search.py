from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from datetime import datetime, timezone
import re

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/suggestions")
async def get_suggestions(
    q: str = Query(..., min_length=1, max_length=50),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """API Gợi ý tìm kiếm nhanh (Autocomplete & Live Search)"""
    # Xóa khoảng trắng thừa và escape ký tự đặc biệt
    search_term = q.strip()
    escaped_term = re.escape(search_term)
    
    # Sử dụng Regex để tìm kiếm không phân biệt chữ hoa chữ thường
    # Lưu ý: Trong dự án thực tế lớn, nên cấu hình Atlas Search để dùng "$search" thay vì "$regex"
    query_filter = {
        "is_active": True,
        "$or": [
            {"name": {"$regex": escaped_term, "$options": "i"}},
            {"description": {"$regex": escaped_term, "$options": "i"}},
            {"category": {"$regex": escaped_term, "$options": "i"}}
        ]
    }
    
    products = await db.products.find(
        query_filter, 
        {"name": 1, "images": 1, "base_price": 1, "category": 1}
    ).limit(8).to_list(8)
    
    # Format kết quả trả về
    results = []
    for p in products:
        results.append({
            "_id": str(p["_id"]),
            "name": p["name"],
            "image": p["images"][0] if p.get("images") else None,
            "price": p["base_price"],
            "category": p.get("category", "")
        })
        
    # Xử lý background: Lưu thống kê tìm kiếm (giả lập bất đồng bộ)
    norm_key = search_term.lower()
    await db.search_analytics.update_one(
        {"normalized_keyword": norm_key},
        {
            "$inc": {
                "search_count": 1, 
                "zero_results_count": 1 if len(results) == 0 else 0
            },
            "$set": {
                "keyword": search_term,
                "last_searched_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"items": results}
