"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Order, QRPaymentResponse } from "@/types";
import { CheckCircle, Clock, Truck, Package, XCircle, RefreshCw, MapPin, QrCode, Loader2, ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const STEPS = [
  { key: "pending_payment", label: "Chờ thanh toán", icon: Clock },
  { key: "paid", label: "Đã thanh toán", icon: CheckCircle },
  { key: "processing", label: "Đang xử lý", icon: RefreshCw },
  { key: "shipping", label: "Đang giao hàng", icon: Truck },
  { key: "delivered", label: "Đã giao thành công", icon: Package },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QRPaymentResponse | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  // WebSocket
  const isPending = order?.order_status === "pending_payment";
  const { paymentStatus, orderStatus, isConnected } = usePaymentStatus(
    order?.order_code ?? null,
    isPending
  );

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (paymentStatus === "paid" && order && order.payment.status !== "paid") {
      toast.success("🎉 Thanh toán xác nhận thành công!");
      setOrder((prev) => prev ? {
        ...prev,
        order_status: orderStatus,
        payment: { ...prev.payment, status: paymentStatus },
      } : prev);
    }
  }, [paymentStatus]);

  useEffect(() => {
    // Generate QR automatically if pending
    if (order && order.order_status === "pending_payment" && !qrData && !loadingQR) {
      const generateQR = async () => {
        setLoadingQR(true);
        try {
          const { data } = await api.post("/payment/create-qr", {
            order_id: order._id,
            payment_method: order.payment.method === "cod" ? "qr_vietqr" : order.payment.method,
          });
          setQrData(data);
        } catch (err: any) {
          toast.error("Không thể tạo QR. Vui lòng thử lại.");
        } finally {
          setLoadingQR(false);
        }
      };
      generateQR();
    }
  }, [order, qrData, loadingQR]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    
    setIsCancelling(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      toast.success("Đã huỷ đơn hàng thành công");
      router.push("/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Không thể hủy đơn hàng");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    if (!confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xoá vĩnh viễn đơn hàng này khỏi lịch sử mua hàng?")) return;
    
    try {
      await api.delete(`/orders/${order._id}`);
      toast.success("Đã xoá đơn hàng khỏi lịch sử");
      router.push("/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Không thể xoá đơn hàng");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <p className="text-gray-500 mb-6 text-lg">Không tìm thấy đơn hàng</p>
        <Link href="/orders" className="btn-primary inline-flex px-8 rounded-full">Quay lại danh sách</Link>
      </div>
    );
  }

  const activeOrderStatus = (orderStatus && orderStatus !== "pending_payment") ? orderStatus : order.order_status;
  const isCancelled = activeOrderStatus === "cancelled" || order.order_status === "cancelled";

  // Màn hình Thanh toán (Pending Payment Layout - Minimalist Split Screen)
  if (isPending && !isCancelled) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Trái: Order Summary */}
          <div className="w-full md:w-5/12 p-8 md:p-12 bg-gray-50/50 flex flex-col border-r border-gray-100">
            <div className="flex items-center justify-between mb-12">
              <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={16} /> Quay lại
              </Link>
              <button 
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {isCancelling ? "Đang huỷ..." : "Huỷ đơn hàng"}
              </button>
            </div>
            
            <div className="mb-8">
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Mã đơn hàng</p>
              <h2 className="text-xl font-semibold text-slate-900">{order.order_code}</h2>
            </div>

            <div className="space-y-4 mb-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-14 h-14 bg-white rounded-xl border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-slate-800 text-sm line-clamp-2 leading-snug">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {Object.values(item.variant_info).filter(Boolean).join(", ")} <span className="mx-1">•</span> SL: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm pt-1 whitespace-nowrap">
                    {item.subtotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-gray-200/60 pt-6">
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-700">{order.subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-slate-700">{order.shipping_fee === 0 ? "Miễn phí" : `${order.shipping_fee.toLocaleString("vi-VN")}đ`}</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-gray-500 mb-1">Tổng thanh toán</span>
                <span className="text-3xl font-black tracking-tight text-blue-600">{order.total_amount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>

          {/* Phải: QR Payment */}
          <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col items-center justify-center bg-white relative">
            {isConnected && (
              <div className="absolute top-8 right-8 flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide">Live</span>
              </div>
            )}

            <div className="text-center mb-10 w-full max-w-sm mx-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mb-6">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">Thanh toán đơn hàng</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã. Giao dịch sẽ được xác nhận tự động.
              </p>
            </div>

            <div className="relative p-6 bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out flex items-center justify-center min-h-[280px] min-w-[280px]">
              {loadingQR ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                  <div className="w-56 h-56 bg-gray-100/80 rounded-2xl"></div>
                </div>
              ) : qrData ? (
                <div className="animate-in fade-in zoom-in-95 duration-700 ease-out">
                  <img src={qrData.qr_data_url} alt="QR Code" className="w-56 h-56 object-contain rounded-xl" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <QrCode size={40} className="opacity-20" />
                  <p className="text-sm">Không thể tải mã QR</p>
                </div>
              )}
            </div>

            <p className="mt-8 text-xs font-medium text-gray-400 tracking-wide uppercase flex items-center gap-2">
              <ShieldCheck size={14} className="opacity-50" /> Thanh toán an toàn và bảo mật
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Màn hình trạng thái đơn hàng (Đã thanh toán, Đang giao...)
  const currentStepIndex = STEPS.findIndex((s) => s.key === activeOrderStatus);
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <Link href="/orders" className="text-sm font-medium text-gray-400 hover:text-slate-800 mb-4 inline-flex items-center gap-2 transition-colors">
            <ArrowLeft size={16} /> Danh sách đơn hàng
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{order.order_code}</h1>
          <p className="text-gray-500 mt-2">
            Ngày đặt: {new Date(order.created_at).toLocaleDateString("vi-VN", { dateStyle: "long" })}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className="bg-white rounded-3xl p-8 mb-8 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-slate-800 text-lg mb-8">Tiến trình giao hàng</h2>
          <div className="flex items-start justify-between relative px-2">
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-100 mx-10" />
            <div
              className="absolute top-5 left-0 h-[2px] bg-blue-500 mx-10 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 bg-white border-[3px] ${
                    isDone ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" : "border-gray-100"
                  }`}>
                    <StepIcon size={16} className={isDone ? "text-blue-500" : "text-gray-300"} />
                  </div>
                  <p className={`text-[11px] font-semibold tracking-wide uppercase mt-4 text-center leading-tight hidden sm:block ${isDone ? "text-slate-700" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 p-6 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-100">
          <div className="flex items-center gap-4">
            <XCircle className="text-red-500 shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-bold">Đơn hàng đã bị huỷ</p>
              <p className="text-red-600 text-sm mt-1">Đơn hàng này không còn hiệu lực.</p>
            </div>
          </div>
          <button 
            onClick={handleDeleteOrder} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Trash2 size={16} />
            Xoá khỏi lịch sử
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-slate-800 text-lg mb-6">Sản phẩm</h2>
            <div className="space-y-5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Object.values(item.variant_info).filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{item.subtotal.toLocaleString("vi-VN")}đ</p>
                    <p className="text-xs text-gray-400 mt-1">SL: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-8 pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-gray-500"><span>Tạm tính</span><span className="font-medium text-slate-700">{order.subtotal.toLocaleString("vi-VN")}đ</span></div>
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-slate-700">{order.shipping_fee === 0 ? <span className="text-green-600">Miễn phí</span> : `${order.shipping_fee.toLocaleString("vi-VN")}đ`}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-lg pt-4 border-t border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{order.total_amount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" /> Địa chỉ giao hàng
            </h2>
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-800">{order.shipping_address.full_name}</p>
              <p className="text-sm text-gray-500">{order.shipping_address.phone}</p>
              <p className="text-sm text-gray-500 leading-relaxed pt-2">
                {order.shipping_address.street}<br />
                {order.shipping_address.district}, {order.shipping_address.city}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
