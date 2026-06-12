"""
upload.py router
=================
POST /api/upload/image  — Upload ảnh lên Cloudinary
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.config import get_settings
from app.middleware.auth_middleware import require_admin
import httpx
import base64
import os
import shutil
import uuid
from fastapi import Request

router = APIRouter(prefix="/api/upload", tags=["Upload"])
settings = get_settings()


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: dict = Depends(require_admin),
):
    # Kiểm tra cấu hình Cloudinary
    use_cloudinary = bool(settings.cloudinary_cloud_name and settings.cloudinary_api_key)

    if not use_cloudinary:
        # Fallback: Lưu ảnh local
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Validate kích thước
        file.file.seek(0, 2) # go to end
        size = file.file.tell()
        file.file.seek(0) # go back to start
        if size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File quá lớn (tối đa 10MB)")
            
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        new_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(upload_dir, new_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trả về URL local (Lưu ý: Yêu cầu main.py phải mount thư mục này)
        base_url = settings.backend_url or "http://localhost:8000"
        return {
            "url": f"{base_url}/uploads/{new_filename}",
            "public_id": new_filename,
            "width": None,
            "height": None,
        }

    # Đọc file
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File quá lớn (tối đa 10MB)")

    # Encode base64
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    data_uri = f"data:{mime};base64,{b64}"

    # Upload lên Cloudinary
    upload_url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            upload_url,
            data={
                "file": data_uri,
                "upload_preset": "ml_default",
                "folder": "ecommerce-qr/products",
            },
            auth=(settings.cloudinary_api_key, settings.cloudinary_api_secret),
        )

    if response.status_code != 200:
        # Thử lại không dùng preset
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                upload_url,
                data={"file": data_uri},
                auth=(settings.cloudinary_api_key, settings.cloudinary_api_secret),
            )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Upload thất bại: {response.text}")

    data = response.json()
    return {
        "url": data.get("secure_url"),
        "public_id": data.get("public_id"),
        "width": data.get("width"),
        "height": data.get("height"),
    }
