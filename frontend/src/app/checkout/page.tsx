"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import QRPaymentModal from "@/components/checkout/QRPaymentModal";
import { QRPaymentResponse } from "@/types";
import toast from "react-hot-toast";
import { ShieldCheck, ArrowLeft, QrCode, Truck, Lock } from "lucide-react";
import Link from "next/link";

const shippingSchema = z.object({
  full_name: z.string().min(2, "Họ tên quá ngắn"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  street: z.string().min(5, "Địa chỉ quá ngắn"),
  district: z.string().min(2, "Vui lòng nhập Quận/Huyện"),
  city: z.string().min(2, "Vui lòng nhập Tỉnh/Thành phố"),
});

type ShippingForm = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<"qr_vietqr" | "cod">("qr_vietqr");
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<QRPaymentResponse | null>(null);

  const shippingFee = totalAmount() >= 500000 ? 0 : 35000;
  const total = totalAmount() + shippingFee;

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth/login?redirect=/checkout");
    if (items.length === 0) router.push("/cart");
  }, [isAuthenticated, items]);

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (shippingData: ShippingForm) => {
    setIsLoading(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((item) => ({
          product_id: item.product_id,
          sku: item.sku,
          quantity: item.quantity,
        })),
        shipping_address: shippingData,
        payment_method: paymentMethod,
        notes: "",
      });

      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/orders/${order.order_code}`);
        return;
      }

      // Tạo QR
      const { data: qr } = await api.post("/payment/create-qr", {
        order_id: order._id,
        payment_method: paymentMethod,
      });

      setQrData(qr);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setQrData(null);
    router.push("/orders");
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-200 font-sans">
      <div className="grid lg:grid-cols-[1.2fr_1fr] min-h-screen">
        
        {/* Left Column: Form */}
        <div className="px-6 sm:px-12 py-12 lg:py-20 lg:pl-24 lg:pr-32 xl:pl-[15%] flex flex-col justify-between">
          <div>
            {/* Minimal Header */}
            <div className="mb-12">
              <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                <ArrowLeft size={14} /> Quay lại giỏ hàng
              </Link>
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Thanh toán</h1>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              
              {/* Shipping Section */}
              <section>
                <h2 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</span>
                  Thông tin giao hàng
                </h2>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Họ và tên</label>
                    <input {...register("full_name")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Tên người nhận" />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Số điện thoại</label>
                    <input {...register("phone")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Số điện thoại liên hệ" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Địa chỉ chi tiết</label>
                    <input {...register("street")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Số nhà, tên đường, phường/xã" />
                    {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Quận / Huyện</label>
                    <input {...register("district")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Quận/Huyện" />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Tỉnh / Thành phố</label>
                    <input {...register("city")} className="w-full px-0 py-3 border-0 border-b border-slate-200 focus:ring-0 focus:border-slate-900 bg-transparent text-slate-900 font-medium placeholder:text-slate-300 placeholder:font-light outline-none transition-colors" placeholder="Tỉnh/TP" />
                  </div>
                </div>
              </section>

              {/* Payment Section */}
              <section>
                <h2 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>
                  Phương thức thanh toán
                </h2>
                
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "qr_vietqr" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "qr_vietqr" ? "border-slate-900" : "border-slate-300"}`}>
                      {paymentMethod === "qr_vietqr" && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <QrCode size={24} className="text-slate-700" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">Chuyển khoản QR tự động</p>
                        <p className="text-slate-500 text-xs font-light mt-0.5">Xác nhận đơn ngay lập tức (Miễn phí)</p>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "cod" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "border-slate-900" : "border-slate-300"}`}>
                      {paymentMethod === "cod" && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <Truck size={24} className="text-slate-700" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-slate-500 text-xs font-light mt-0.5">Trả tiền mặt khi nhân viên giao hàng</p>
                      </div>
                    </div>
                  </label>
                </div>
              </section>

            </form>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-xs font-light text-slate-400">
            <span>Được bảo vệ bằng mã hóa 256-bit</span>
            <Lock size={14} />
          </div>
        </div>

        {/* Right Column: Order Summary (Sticky side) */}
        <div className="bg-[#fafafa] border-l border-slate-100 px-6 sm:px-12 py-12 lg:py-20 lg:pr-24 lg:pl-20 xl:pr-[15%] flex flex-col relative">
          <div className="sticky top-20">
            <h2 className="text-lg font-medium text-slate-900 mb-8">Chi tiết đơn hàng</h2>
            
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.sku} className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-20 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <img src={item.image || "https://via.placeholder.com/100"} alt={item.product_name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      {[item.variant_info.size, item.variant_info.color].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-900 pt-1 shrink-0">
                    {item.subtotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-6 space-y-4 text-sm font-light mb-8">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span className="text-slate-900 font-medium">{totalAmount().toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? "text-green-600 font-medium" : "text-slate-900 font-medium"}>
                  {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")}đ`}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mb-10 flex items-end justify-between">
              <span className="text-base font-medium text-slate-900">Tổng cộng</span>
              <div className="text-right">
                <span className="text-xs text-slate-500 mr-2 uppercase">VND</span>
                <span className="text-3xl font-medium tracking-tight text-slate-900">{total.toLocaleString("vi-VN")}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-5 rounded-full text-base font-medium hover:bg-slate-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                paymentMethod === "cod" ? "Hoàn tất đặt hàng" : "Đặt hàng & Quét QR"
              )}
            </button>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={14} /> Hệ thống bảo mật
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal handles pending payment state natively within order page instead, but kept here for backward compat */}
      {qrData && (
        <QRPaymentModal
          isOpen={!!qrData}
          onClose={() => setQrData(null)}
          qrData={qrData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
