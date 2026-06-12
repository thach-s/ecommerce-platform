"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { User, Mail, Phone, Shield, Loader2, Package, LogOut, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

const profileSchema = z.object({
  full_name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [activeTab, setActiveTab] = useState("profile");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/profile");
      return;
    }
    if (user) {
      reset({ full_name: user.full_name, phone: user.phone || "" });
    }
    api.get("/orders?page_size=5").then((res) => setOrders(res.data)).catch(() => {});
  }, [mounted, isAuthenticated, user]);

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const { data: updated } = await api.put("/auth/me", data);
      setUser(updated);
      toast.success("Đã lưu thay đổi!", { icon: "✅", style: { borderRadius: "100px", background: "#333", color: "#fff" } });
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-white pt-12 pb-32">
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
        <h1 className="text-4xl font-medium text-slate-900 tracking-tight mb-12">Tài khoản</h1>

        <div className="grid lg:grid-cols-[1fr_3fr] gap-12 lg:gap-20 items-start">
          
          {/* Sidebar */}
          <aside className="sticky top-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-medium text-slate-900 border border-slate-200">
                {initials}
              </div>
              <div>
                <p className="font-medium text-slate-900">{user.full_name}</p>
                <p className="text-sm text-slate-500 font-light">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === "profile" ? "bg-slate-50 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"}`}
              >
                <User size={18} strokeWidth={1.5} /> Thông tin cá nhân
              </button>
              <button 
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === "orders" ? "bg-slate-50 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"}`}
              >
                <div className="flex items-center gap-3"><Package size={18} strokeWidth={1.5} /> Đơn hàng của tôi</div>
                {orders.total > 0 && <span className="bg-slate-200 text-slate-700 text-xs py-0.5 px-2 rounded-full">{orders.total}</span>}
              </button>
              {user.role === "admin" && (
                <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 transition-all">
                  <Shield size={18} strokeWidth={1.5} /> Quản trị Admin
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-4"
              >
                <LogOut size={18} strokeWidth={1.5} /> Đăng xuất
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main>
            {activeTab === "profile" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-medium text-slate-900 mb-8">Thông tin cá nhân</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Họ và tên</label>
                      <input {...register("full_name")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium outline-none transition-colors" />
                      {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Số điện thoại</label>
                      <input {...register("phone")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Chưa cập nhật" />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Email đăng nhập</label>
                      <div className="w-full px-0 py-3 border-0 border-b border-slate-100 bg-transparent text-slate-500 font-light flex items-center gap-2">
                        <Mail size={16} /> {user.email}
                      </div>
                      <p className="text-xs text-slate-400 font-light mt-2">Email không thể thay đổi. Vui lòng liên hệ hỗ trợ nếu cần.</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={isSaving} className="bg-slate-900 text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 flex items-center gap-2">
                      {isSaving && <Loader2 size={16} className="animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-medium text-slate-900">Lịch sử mua hàng</h2>
                  <Link href="/orders" className="text-sm font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-colors">Xem tất cả</Link>
                </div>
                
                {orders.items.length > 0 ? (
                  <div className="space-y-6">
                    {orders.items.map((order: any) => (
                      <Link key={order._id} href={`/orders/${order.order_code}`} className="block border border-slate-100 hover:border-slate-300 rounded-3xl p-6 transition-colors group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold text-slate-900 tracking-tight">{order.order_code}</p>
                            <p className="text-sm text-slate-500 font-light mt-0.5">{new Date(order.created_at).toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium text-slate-900">{order.total_amount.toLocaleString("vi-VN")}đ</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              order.order_status === "delivered" ? "bg-green-100 text-green-700" :
                              order.order_status === "cancelled" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {order.order_status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                          Xem chi tiết <ArrowRight size={14} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border border-slate-100">
                    <Package size={32} strokeWidth={1.5} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-900 font-medium mb-1">Chưa có đơn hàng nào</p>
                    <p className="text-slate-500 font-light text-sm mb-6">Bạn chưa thực hiện bất kỳ giao dịch nào.</p>
                    <Link href="/products" className="inline-flex bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-full text-sm font-medium hover:border-slate-900 transition-colors">
                      Bắt đầu mua sắm
                    </Link>
                  </div>
                )}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
