"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { QRPaymentResponse, WSEvent } from "@/types";
import { CheckCircle, XCircle, Clock, RefreshCw, Copy, Wifi, WifiOff, X } from "lucide-react";
import toast from "react-hot-toast";

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: QRPaymentResponse;
  onPaymentSuccess: () => void;
}

type PaymentState = "waiting" | "success" | "failed" | "expired";

const BANK_LOGOS: Record<string, string> = {
  MB: "https://img.vietqr.io/img/MB.png",
  VCB: "https://img.vietqr.io/img/VCB.png",
  TCB: "https://img.vietqr.io/img/TCB.png",
  BIDV: "https://img.vietqr.io/img/BIDV.png",
  VTB: "https://img.vietqr.io/img/CTG.png",
};

export default function QRPaymentModal({ isOpen, onClose, qrData, onPaymentSuccess }: QRPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>("waiting");
  const [timeLeft, setTimeLeft] = useState(qrData.expires_in || 900);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pingRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = qrData.expires_in || 900;
  const progress = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 42; // r=42
  const dashOffset = circumference * (1 - progress / 100);

  const connectWebSocket = useCallback(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/orders/${qrData.order_code}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSEvent = JSON.parse(event.data);
        if (message.event === "payment_success") {
          setPaymentState("success");
          toast.success("🎉 Thanh toán thành công!", { duration: 5000 });
          setTimeout(onPaymentSuccess, 2500);
        } else if (message.event === "payment_failed") {
          setPaymentState("failed");
          toast.error("❌ Thanh toán thất bại. Vui lòng thử lại.");
        }
      } catch (e) {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      if (paymentState === "waiting") setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => setWsConnected(false);
  }, [qrData.order_code, paymentState, onPaymentSuccess]);

  useEffect(() => {
    if (!isOpen || paymentState !== "waiting") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setPaymentState("expired"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isOpen, paymentState]);

  useEffect(() => {
    if (!isOpen) return;
    connectWebSocket();
    return () => {
      wsRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [isOpen]); // eslint-disable-line

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(12px)" }}>
      <div className="relative w-full max-w-md animate-scale-in overflow-hidden"
        style={{ background: "#0f172a", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>

        {/* Gradient border top */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899)" }} />

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Thanh Toán QR
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mã đơn: <span className="text-indigo-400 font-mono font-bold">{qrData.order_code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-semibold ${
              wsConnected ? "text-green-400 bg-green-500/10 border border-green-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"
            }`}>
              {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {wsConnected ? "Live" : "Kết nối..."}
            </span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success */}
          {paymentState === "success" && (
            <div className="text-center py-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, #22c55e20, #16a34a20)", border: "2px solid #22c55e40" }}>
                <CheckCircle className="w-14 h-14 text-green-400" style={{ animation: "bounceIn 0.6s ease" }} />
              </div>
              <h3 className="text-2xl font-black text-green-400 mb-2">Thanh toán thành công!</h3>
              <p className="text-slate-400 text-sm">Đơn hàng của bạn đang được xử lý...</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-green-400/60">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce animation-delay-200" />
                <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce animation-delay-400" />
              </div>
            </div>
          )}

          {/* Failed */}
          {paymentState === "failed" && (
            <div className="text-center py-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
                <XCircle className="w-14 h-14 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-red-400 mb-2">Thanh toán thất bại</h3>
              <p className="text-slate-400 text-sm mb-6">Giao dịch không thành công. Vui lòng thử lại.</p>
              <button onClick={() => { setPaymentState("waiting"); setTimeLeft(900); }}
                className="btn-primary flex items-center gap-2 mx-auto">
                <RefreshCw size={16} /> Thử lại
              </button>
            </div>
          )}

          {/* Expired */}
          {paymentState === "expired" && (
            <div className="text-center py-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.3)" }}>
                <Clock className="w-14 h-14 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-black text-yellow-400 mb-2">QR đã hết hạn</h3>
              <p className="text-slate-400 text-sm mb-6">Mã QR đã quá 15 phút. Tạo mã mới để tiếp tục.</p>
              <button onClick={onClose} className="btn-secondary mx-auto">Tạo QR mới</button>
            </div>
          )}

          {/* Waiting */}
          {paymentState === "waiting" && (
            <>
              {/* Amount + circular timer */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Số tiền thanh toán</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(qrData.total_amount)}</p>
                </div>
                {/* Circular countdown */}
                <div className="relative w-16 h-16">
                  <svg className="absolute inset-0 -rotate-90" width="64" height="64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                    <circle cx="32" cy="32" r="26" fill="none"
                      stroke={timeLeft < 60 ? "#ef4444" : "#4f46e5"}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-mono font-black ${timeLeft < 60 ? "text-red-400" : "text-indigo-400"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Image with glow */}
              <div className="flex justify-center mb-5">
                <div className="relative p-3 bg-white rounded-2xl shadow-2xl" style={{ boxShadow: "0 0 40px rgba(79,70,229,0.3), 0 0 0 1px rgba(79,70,229,0.2)" }}>
                  {qrData.qr_code_url ? (
                    <img
                      src={qrData.qr_code_url}
                      alt="QR Code thanh toán"
                      width={210}
                      height={210}
                      className="rounded-xl block"
                      onError={(e) => {
                        if (qrData.qr_data_url) {
                          (e.target as HTMLImageElement).src = qrData.qr_data_url;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-[210px] h-[210px] flex items-center justify-center bg-slate-100 rounded-xl">
                      <RefreshCw className="animate-spin text-slate-400" size={32} />
                    </div>
                  )}
                  {qrData.bank_id && BANK_LOGOS[qrData.bank_id] && (
                    <img src={BANK_LOGOS[qrData.bank_id]} alt={qrData.bank_id}
                      className="absolute bottom-3 right-3 w-10 h-10 object-contain bg-white rounded-lg shadow p-1" />
                  )}
                </div>
              </div>

              {/* Transfer info pills */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <InfoRow label="Ngân hàng" value={qrData.bank_id || ""} />
                <InfoRow label="Số tài khoản" value={qrData.account_no || ""} onCopy={() => copyToClipboard(qrData.account_no || "", "số tài khoản")} />
                <InfoRow label="Chủ tài khoản" value={qrData.account_name || ""} />
                <InfoRow label="Số tiền" value={formatCurrency(qrData.total_amount)} onCopy={() => copyToClipboard(String(qrData.total_amount), "số tiền")} highlight />
                <InfoRow label="Nội dung CK" value={qrData.transfer_content || qrData.order_code} onCopy={() => copyToClipboard(qrData.transfer_content || qrData.order_code, "nội dung")} highlight />
              </div>

              {/* Instructions */}
              <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.2)" }}>
                <p className="text-xs text-indigo-300 font-bold mb-1.5">📱 Hướng dẫn thanh toán:</p>
                <ol className="text-xs text-indigo-200/80 space-y-1 list-decimal list-inside">
                  <li>Mở app ngân hàng / ví điện tử</li>
                  <li>Quét mã QR hoặc chuyển khoản thủ công</li>
                  <li>Nhập đúng <strong className="text-indigo-300">nội dung chuyển khoản</strong></li>
                  <li>Trang sẽ tự cập nhật khi xác nhận thành công</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy, highlight = false }: {
  label: string; value: string; onCopy?: () => void; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}:</span>
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
        <span className={`text-xs font-semibold text-right truncate ${highlight ? "text-indigo-300" : "text-slate-300"}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors shrink-0">
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
