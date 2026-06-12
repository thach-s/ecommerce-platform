from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class AddressSchema(BaseModel):
    street: str
    district: str
    city: str
    zip: Optional[str] = None


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[AddressSchema] = None


class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    hashed_password: str
    role: Literal["customer", "admin"] = "customer"
    is_active: bool = True
    avatar_url: Optional[str] = None
    address: Optional[AddressSchema] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """Public-facing user schema (no password)"""
    id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    address: Optional[AddressSchema] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
