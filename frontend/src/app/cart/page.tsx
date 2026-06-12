"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalAmount, totalItems } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  const shippingFee = totalAmount() >= 500000 ? 0 : 35000;
  const total = totalAmount() + shippingFee;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán", {
        icon: '🔒',
        style: { borderRadius: '100px', background: '#333', color: '#fff' }
      });
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center px-6">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
          <ShoppingBag size={48} className="text-slate-300" />
        </div>
        <h1 className="text-3xl font-medium text-slate-900 tracking-tight mb-3">Giỏ hàng trống</h1>
        <p className="text-slate-500 font-light mb-10 text-lg text-center max-w-md">
          Chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các bộ sưu tập của chúng tôi.
        </p>
        <Link href="/products" className="bg-slate-900 text-white px-10 py-4 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-12 pb-32 selection:bg-slate-200">
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
        
        {/* Header */}
        <div className="flex items-end justify-between border-b border-slate-100 pb-8 mb-12">
          <div>
            <Link href="/products" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-6 transition-colors">
              <ArrowLeft size={14} /> Tiếp tục mua sắm
            </Link>
            <h1 className="text-4xl md:text-5xl font-medium text-slate-900 tracking-tight">
              Giỏ hàng
            </h1>
          </div>
          <p className="text-slate-500 text-lg font-light hidden sm:block">
            {totalItems()} sản phẩm
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 lg:gap-24 items-start">
          
          {/* Left: Cart Items (Clean Table-like layout) */}
          <div className="space-y-10">
            <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr] gap-4 pb-4 border-b border-slate-100 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <div>Sản phẩm</div>
              <div className="text-center">Số lượng</div>
              <div className="text-right">Tổng</div>
            </div>

            <div className="space-y-8">
              {items.map((item) => (
                <div key={item.sku} className="grid sm:grid-cols-[3fr_1fr_1fr] gap-6 items-center relative">
                  
                  {/* Product Info */}
                  <div className="flex items-start gap-6">
                    <Link href={`/products/${item.product_id}`} className="shrink-0">
                      <div className="w-24 h-32 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative group">
                        <img
                          src={item.image || "https://via.placeholder.com/150"}
                          alt={item.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    </Link>
                    <div className="flex flex-col pt-1">
                      <h3 className="font-medium text-slate-900 text-base leading-snug line-clamp-2 hover:text-slate-600 transition-colors">
                        <Link href={`/products/${item.product_id}`}>{item.product_name}</Link>
                      </h3>
                      <p className="text-sm text-slate-500 font-light mt-2">
                        {[item.variant_info.size, item.variant_info.color].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-slate-900 font-medium mt-3 sm:hidden">
                        {item.unit_price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center justify-between sm:justify-center mt-4 sm:mt-0 gap-6">
                    <div className="inline-flex items-center border border-slate-200 rounded-full p-1 bg-white">
                      <button onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-slate-500">
                        <span className="w-2.5 h-px bg-current" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-slate-500 relative">
                        <span className="w-2.5 h-px bg-current absolute" />
                        <span className="w-px h-2.5 bg-current absolute" />
                      </button>
                    </div>
                    
                    {/* Mobile Remove Button */}
                    <button onClick={() => removeItem(item.sku)}
                      className="sm:hidden text-xs font-medium text-slate-400 hover:text-red-500 underline underline-offset-4 transition-colors">
                      Xóa
                    </button>
                  </div>

                  {/* Subtotal & Desktop Remove */}
                  <div className="hidden sm:flex flex-col items-end gap-2">
                    <p className="font-medium text-slate-900 text-lg">{item.subtotal.toLocaleString("vi-VN")}đ</p>
                    <button onClick={() => removeItem(item.sku)}
                      className="text-xs font-medium text-slate-400 hover:text-red-500 underline underline-offset-4 transition-colors">
                      Xóa sản phẩm
                    </button>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary Widget */}
          <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 sticky top-12 flex flex-col">
            <h2 className="text-2xl font-medium text-slate-900 mb-8">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-8 text-[15px]">
              <div className="flex justify-between text-slate-600 font-light">
                <span>Tạm tính</span>
                <span className="text-slate-900">{totalAmount().toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-slate-600 font-light">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? "text-green-600 font-medium" : "text-slate-900"}>
                  {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")}đ`}
                </span>
              </div>
            </div>

            {totalAmount() < 500000 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8">
                <p className="text-sm text-slate-600 font-light text-center">
                  Mua thêm <span className="font-semibold text-slate-900">{(500000 - totalAmount()).toLocaleString("vi-VN")}đ</span> để được miễn phí vận chuyển!
                </p>
                <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-slate-900 rounded-full transition-all duration-1000" style={{ width: `${(totalAmount() / 500000) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-6 mb-10">
              <div className="flex justify-between items-end">
                <span className="text-slate-900 font-medium">Tổng thanh toán</span>
                <span className="text-3xl tracking-tight font-medium text-slate-900">{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <p className="text-xs text-slate-400 font-light text-right mt-2">Đã bao gồm thuế VAT (nếu có)</p>
            </div>

            <button onClick={handleCheckout} className="w-full bg-slate-900 text-white py-5 rounded-full text-base font-medium hover:bg-slate-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center gap-2 group">
              Thanh toán <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-500 font-light justify-center">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Thanh toán an toàn và bảo mật
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
