from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    mongodb_url: str
    db_name: str = "ecommerce"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # VietQR
    vietqr_bank_id: str = "MB"
    vietqr_account_no: str
    vietqr_account_name: str
    vietqr_template: str = "compact2"
    vietqr_client_id: str = ""
    vietqr_api_key: str = ""

    # MoMo
    momo_partner_code: str = ""
    momo_access_key: str = ""
    momo_secret_key: str = ""
    momo_endpoint: str = "https://test-payment.momo.vn/v2/gateway/api/create"
    momo_redirect_url: str = "http://localhost:3000/orders"
    momo_ipn_url: str = "http://localhost:8000/api/webhook/momo"

    # ZaloPay
    zalopay_app_id: str = ""
    zalopay_key1: str = ""
    zalopay_key2: str = ""
    zalopay_endpoint: str = "https://sb-openapi.zalopay.vn/v2/create"
    zalopay_callback_url: str = "http://localhost:8000/api/webhook/zalopay"

    # Server
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"

    # Webhook
    webhook_secret: str

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
