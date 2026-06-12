"""
main.py — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.database import connect_db, disconnect_db
from app.config import get_settings
from app.routers import auth, products, orders, payment, webhook, admin, upload, search

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    yield
    # Shutdown
    await disconnect_db()


app = FastAPI(
    title="🛒 E-Commerce QR API",
    description="Backend API cho hệ thống thương mại điện tử với thanh toán QR động",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Mount Static Files ────────────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(payment.ws_router)   # WebSocket
app.include_router(webhook.router)
app.include_router(admin.router)
app.include_router(upload.router)
app.include_router(search.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "E-Commerce QR API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
