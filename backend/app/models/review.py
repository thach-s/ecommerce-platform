from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)

class ReviewInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewResponse(ReviewInDB):
    pass
