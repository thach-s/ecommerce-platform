"use client";

import { useEffect, useRef, useState } from "react";
import { Order, PaymentStatus, OrderStatus, WSEvent } from "@/types";
import api from "@/lib/api";

interface PaymentStatusResult {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook lắng nghe trạng thái thanh toán theo thời gian thực.
 *
 * Ưu tiên WebSocket; nếu WS không kết nối được thì fallback sang polling.
 */
export function usePaymentStatus(
  orderCode: string | null,
  enabled: boolean = true
): PaymentStatusResult {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending_payment");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const wsFailedRef = useRef(false);

  useEffect(() => {
    if (!orderCode || !enabled) return;

    // ── WebSocket ──────────────────────────────────────────────────────────
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/orders/${orderCode}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectTimeout = setTimeout(() => {
      // Nếu sau 5s vẫn chưa kết nối được -> dùng polling
      if (ws.readyState !== WebSocket.OPEN) {
        wsFailedRef.current = true;
        startPolling();
      }
    }, 5000);

    ws.onopen = () => {
      setIsConnected(true);
      wsFailedRef.current = false;
      clearTimeout(connectTimeout);
      // Dừng polling nếu đang chạy
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const message: WSEvent = JSON.parse(event.data);
        if (message.event === "connected") {
          setPaymentStatus(message.payment_status as PaymentStatus);
          setOrderStatus(message.order_status as OrderStatus);
        } else if (message.event === "payment_success") {
          setPaymentStatus("paid");
          setOrderStatus("paid");
          setLastUpdated(new Date());
        } else if (message.event === "payment_failed") {
          setPaymentStatus("failed");
          setLastUpdated(new Date());
        }
      } catch {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Nếu WS đóng và chưa thanh toán -> chuyển sang polling
      if (!wsFailedRef.current) {
        wsFailedRef.current = true;
        startPolling();
      }
    };

    // ── Polling Fallback ───────────────────────────────────────────────────
    function startPolling() {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await api.get<Order>(`/orders/${orderCode}`);
          setPaymentStatus(data.payment.status);
          setOrderStatus(data.order_status);
          setLastUpdated(new Date());
          // Dừng polling khi đã xử lý xong
          if (["paid", "failed", "cancelled"].includes(data.payment.status)) {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
          }
        } catch {}
      }, 5000); // Poll mỗi 5 giây
    }

    return () => {
      clearTimeout(connectTimeout);
      wsRef.current?.close();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderCode, enabled]);

  return { paymentStatus, orderStatus, isConnected, lastUpdated };
}
