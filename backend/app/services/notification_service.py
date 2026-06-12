"""
notification_service.py
========================
WebSocket manager để push thông báo real-time đến client.

Khi webhook nhận IPN thanh toán thành công:
  webhook.py -> notification_service.broadcast_payment_success(order_id)
             -> WebSocket gửi message đến tab trình duyệt của khách hàng
             -> Frontend cập nhật UI ngay lập tức (không cần F5)
"""

import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Map: order_code -> set of WebSocket connections (1 đơn hàng có thể
        # được xem từ nhiều tab/thiết bị)
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, order_code: str):
        await websocket.accept()
        if order_code not in self.active_connections:
            self.active_connections[order_code] = set()
        self.active_connections[order_code].add(websocket)
        print(f"🔌 WS connected: order={order_code}, total={len(self.active_connections[order_code])}")

    def disconnect(self, websocket: WebSocket, order_code: str):
        if order_code in self.active_connections:
            self.active_connections[order_code].discard(websocket)
            if not self.active_connections[order_code]:
                del self.active_connections[order_code]
        print(f"🔌 WS disconnected: order={order_code}")

    async def broadcast_to_order(self, order_code: str, message: dict):
        """Push message đến tất cả client đang theo dõi đơn hàng này."""
        if order_code not in self.active_connections:
            return

        dead_connections = set()
        for websocket in self.active_connections[order_code]:
            try:
                await websocket.send_text(json.dumps(message, ensure_ascii=False))
            except Exception:
                dead_connections.add(websocket)

        # Dọn kết nối đã chết
        for ws in dead_connections:
            self.active_connections[order_code].discard(ws)

    async def broadcast_payment_success(self, order_code: str, order_data: dict):
        """Shortcut: gửi thông báo thanh toán thành công."""
        await self.broadcast_to_order(order_code, {
            "event": "payment_success",
            "order_code": order_code,
            "order_status": "paid",
            "message": "Thanh toán thành công! Đơn hàng của bạn đang được xử lý.",
            "data": order_data,
        })

    async def broadcast_payment_failed(self, order_code: str):
        """Gửi thông báo thanh toán thất bại."""
        await self.broadcast_to_order(order_code, {
            "event": "payment_failed",
            "order_code": order_code,
            "message": "Thanh toán thất bại. Vui lòng thử lại.",
        })


# Singleton instance — dùng chung toàn app
manager = ConnectionManager()
