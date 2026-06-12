"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Order } from "@/types";
import { ShoppingBag, Search, CheckCircle, Clock, Truck, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Đã thanh toán", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
  shipping: { label: "Đang giao", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
  refunded: { label: "Đã hoàn tiền", color: "bg-gray-100 text-gray-700" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    api.get(`/orders/admin/all${query}`)
      .then((res) => setOrders(res.data.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/admin/${orderId}/status`, { order_status: newStatus });
      toast.success("Đã cập nhật trạng thái đơn hàng");
      fetchOrders();
    } catch (err) {
      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1">Theo dõi và cập nhật trạng thái đơn hàng</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">TT Thanh toán</th>
                <th className="px-6 py-4">TT Đơn hàng</th>
                <th className="px-6 py-4 text-right">Cập nhật TT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Đang tải...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Chưa có đơn hàng nào</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending_payment;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {order.order_code}
                        <div className="text-xs text-gray-400 font-normal mt-0.5">
                          {new Date(order.created_at).toLocaleString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{order.shipping_address.full_name}</p>
                        <p className="text-xs text-gray-500">{order.shipping_address.phone}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-700">
                        {order.total_amount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-6 py-4">
                        {order.payment.status === "paid" ? (
                          <span className="badge bg-green-100 text-green-700">Đã thanh toán</span>
                        ) : (
                          <span className="badge bg-yellow-100 text-yellow-700">Chưa thanh toán</span>
                        )}
                        <p className="text-xs text-gray-400 mt-1 uppercase">{order.payment.method.replace("qr_", "")}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          className="input py-1.5 text-sm w-36 bg-gray-50 border-gray-200"
                          value={order.order_status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
