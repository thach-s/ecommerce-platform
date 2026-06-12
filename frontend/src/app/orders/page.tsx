"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Order } from "@/types";
import Link from "next/link";
import { Package, Clock, CheckCircle, Truck, XCircle, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Đã thanh toán", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700", icon: RefreshCw },
  shipping: { label: "Đang giao", color: "bg-orange-100 text-orange-700", icon: Truck },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Đã huỷ", color: "bg-red-100 text-red-700", icon: XCircle },
  refunded: { label: "Đã hoàn tiền", color: "bg-gray-100 text-gray-700", icon: RefreshCw },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders")
      .then((res) => setOrders(res.data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hành động này không thể hoàn tác. Xoá đơn hàng này khỏi lịch sử?")) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success("Đã xoá đơn hàng thành công");
    } catch {
      toast.error("Không thể xoá đơn hàng");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-3" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h1>
        <Link href="/products" className="btn-primary mt-4 inline-flex">Mua sắm ngay</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Đơn hàng của tôi</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const status = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending_payment;
          const StatusIcon = status.icon;
          return (
            <Link href={`/orders/${order.order_code}`} key={order._id}>
              <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{order.order_code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`badge ${status.color} flex items-center gap-1`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{order.items.length} sản phẩm</p>
                  <div className="flex items-center gap-3">
                    {order.order_status === "cancelled" && (
                      <button 
                        onClick={(e) => handleDelete(e, order._id)}
                        className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                        title="Xoá đơn hàng"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <p className="font-black text-blue-700">{order.total_amount.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
