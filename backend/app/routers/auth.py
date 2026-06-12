from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId

from app.database import get_db
from app.models.user import UserCreate, UserResponse, TokenResponse
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _serialize_user(user: dict) -> dict:
    user["_id"] = str(user["_id"])
    return user


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Kiểm tra email đã tồn tại
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    new_user = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "phone": user_data.phone,
        "hashed_password": hash_password(user_data.password),
        "role": "customer",
        "is_active": True,
        "avatar_url": None,
        "address": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)

    token_data = {"sub": new_user["_id"], "role": new_user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse(
            id=new_user["_id"],
            full_name=new_user["full_name"],
            email=new_user["email"],
            phone=new_user["phone"],
            role=new_user["role"],
            created_at=new_user["created_at"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
        )
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khoá")

    user = _serialize_user(user)
    token_data = {"sub": user["_id"], "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse(
            id=user["_id"],
            full_name=user["full_name"],
            email=user["email"],
            phone=user.get("phone"),
            role=user["role"],
            avatar_url=user.get("avatar_url"),
            created_at=user["created_at"],
        ),
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    token_data = {"sub": payload["sub"], "role": payload.get("role", "customer")}
    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        full_name=current_user["full_name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        role=current_user["role"],
        avatar_url=current_user.get("avatar_url"),
        created_at=current_user["created_at"],
    )


from pydantic import BaseModel  # noqa: E402
from typing import Optional  # noqa: E402


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UpdateProfileRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cập nhật thông tin cá nhân user đang đăng nhập."""
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        return UserResponse(
            id=current_user["_id"],
            full_name=current_user["full_name"],
            email=current_user["email"],
            phone=current_user.get("phone"),
            role=current_user["role"],
            avatar_url=current_user.get("avatar_url"),
            created_at=current_user["created_at"],
        )

    update_fields["updated_at"] = datetime.utcnow()
    updated = await db.users.find_one_and_update(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_fields},
        return_document=True,
    )
    updated = _serialize_user(updated)
    return UserResponse(
        id=updated["_id"],
        full_name=updated["full_name"],
        email=updated["email"],
        phone=updated.get("phone"),
        role=updated["role"],
        avatar_url=updated.get("avatar_url"),
        created_at=updated["created_at"],
    )
