"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Product, ProductVariant, Review } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { ShoppingBag, Star, Package, Truck, ArrowLeft, MessageSquare, ShieldCheck, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        if (res.data.variants?.length > 0) setSelectedVariant(res.data.variants[0]);
        api.get(`/products/${res.data.slug}/reviews`).then(r => setReviews(r.data)).catch(() => {});
      })
      .catch(() => router.push("/products"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (selectedVariant.stock < quantity) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }
    addItem({
      product_id: product._id,
      product_name: product.name,
      image: product.images[0] || "",
      sku: selectedVariant.sku,
      variant_info: { size: selectedVariant.size, color: selectedVariant.color },
      quantity,
      unit_price: selectedVariant.price,
      subtotal: selectedVariant.price * quantity,
    });
    toast.success("Đã thêm vào giỏ hàng!", { 
      icon: '🛒',
      style: { borderRadius: '100px', background: '#333', color: '#fff' }
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Vui lòng nhập bình luận");
    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${product?._id}/reviews`, { rating, comment });
      setReviews([res.data, ...reviews]);
      setComment("");
      setRating(5);
      toast.success("Đã gửi đánh giá");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen pt-12 pb-24 px-6">
        <div className="max-w-[90rem] mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-16">
          <div className="aspect-[3/4] bg-slate-100 rounded-[3rem] animate-pulse" />
          <div className="space-y-6 pt-10">
            <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
            <div className="h-16 bg-slate-100 rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-slate-100 rounded w-1/3 animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-3xl animate-pulse mt-12" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];

  return (
    <div className="bg-white min-h-screen pt-8 pb-32 selection:bg-slate-200">
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
        {/* Breadcrumb */}
        <Link href="/products" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-12 transition-colors">
          <ArrowLeft size={14} /> Quay lại cửa hàng
        </Link>

        {/* Product Top Section */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-16 xl:gap-24 items-start">
          
          {/* Left: Gallery */}
          <div className="flex flex-col md:flex-row gap-6 sticky top-12">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto order-2 md:order-1 scrollbar-hide md:max-h-[800px] pb-4 md:pb-0 shrink-0">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-20 h-28 rounded-2xl overflow-hidden shrink-0 transition-all ${i === activeImage ? "ring-1 ring-slate-900 ring-offset-2 opacity-100 scale-100" : "opacity-50 hover:opacity-100 hover:scale-95"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image */}
            <div className="flex-1 order-1 md:order-2">
              <div className="relative aspect-[3/4] rounded-[2.5rem] bg-slate-50 overflow-hidden border border-slate-100">
                {product.images[activeImage] ? (
                  <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-slate-200" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Info & Form */}
          <div className="space-y-12 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                {product.category}
              </p>
              <h1 className="text-4xl sm:text-5xl font-medium text-slate-900 tracking-tight leading-[1.15] mb-6">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="text-3xl text-slate-900 tracking-tight">
                  {(selectedVariant?.price || product.base_price).toLocaleString("vi-VN")}đ
                </div>
                {product.rating_count > 0 && (
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                    <Star size={16} className="text-slate-900 fill-slate-900" />
                    <span className="text-sm font-medium text-slate-900">{product.rating_avg.toFixed(1)}</span>
                    <span className="text-sm text-slate-400 font-light">({product.rating_count} đánh giá)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* Selection Form */}
            <div className="space-y-8">
              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-slate-900">Màu sắc</p>
                    <p className="text-sm text-slate-500 font-light">{selectedVariant?.color || "Chọn màu"}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {colors.map((color) => {
                      const variant = product.variants.find((v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
                      const isSelected = selectedVariant?.color === color;
                      return (
                        <button key={color} onClick={() => variant && setSelectedVariant(variant)}
                          className={`px-6 py-3 rounded-full text-sm font-medium transition-all border ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-900"}`}>
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-slate-900">Kích thước</p>
                    <button className="text-xs text-slate-400 hover:text-slate-900 underline underline-offset-4 transition-colors">Hướng dẫn chọn size</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {sizes.map((size) => {
                      const variant = product.variants.find((v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
                      const isSelected = selectedVariant?.size === size;
                      return (
                        <button key={size} onClick={() => variant && setSelectedVariant(variant)}
                          className={`py-3 rounded-2xl border text-sm font-medium transition-all ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-900"}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Info */}
              {selectedVariant && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className={`w-2 h-2 rounded-full ${selectedVariant.stock > 5 ? "bg-green-500" : selectedVariant.stock > 0 ? "bg-orange-500" : "bg-red-500"}`} />
                  {selectedVariant.stock > 0 ? `Còn ${selectedVariant.stock} sản phẩm sẵn sàng giao` : "Tạm hết hàng"}
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium text-slate-900 mb-4">Số lượng</p>
                <div className="inline-flex items-center border border-slate-200 rounded-full p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-slate-600">
                    <span className="w-3 h-0.5 bg-current" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-slate-900">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-slate-600 relative">
                    <span className="w-3 h-0.5 bg-current absolute" />
                    <span className="w-0.5 h-3 bg-current absolute" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4">
              <button onClick={handleAddToCart} disabled={!selectedVariant?.stock} className="w-full bg-slate-900 text-white rounded-full py-5 text-sm font-medium hover:bg-slate-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                {selectedVariant?.stock ? "Thêm vào giỏ" : "Hết hàng"}
              </button>
              <button onClick={handleBuyNow} disabled={!selectedVariant?.stock} className="w-full bg-white border border-slate-200 text-slate-900 rounded-full py-5 text-sm font-medium hover:border-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Mua ngay & Thanh toán QR
              </button>
            </div>

            {/* Trust Signals */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><Truck size={18} className="text-slate-900" /></div>
                <div>
                  <p className="font-medium text-slate-900">Giao hàng miễn phí</p>
                  <p className="text-slate-500 text-xs font-light mt-0.5">Áp dụng cho mọi đơn hàng trên 500,000đ</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><RefreshCw size={18} className="text-slate-900" /></div>
                <div>
                  <p className="font-medium text-slate-900">Đổi trả trong 30 ngày</p>
                  <p className="text-slate-500 text-xs font-light mt-0.5">Không cần lý do, hoàn tiền nhanh chóng</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm"><ShieldCheck size={18} className="text-slate-900" /></div>
                <div>
                  <p className="font-medium text-slate-900">Thanh toán an toàn</p>
                  <p className="text-slate-500 text-xs font-light mt-0.5">Mã hóa đầu cuối, xác nhận bằng hệ thống ngân hàng</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-8">
                <p className="text-sm font-medium text-slate-900 mb-4">Chi tiết sản phẩm</p>
                <div className="text-slate-500 font-light text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-20 border-t border-slate-100">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
            
            {/* Review Form / Stats */}
            <div>
              <h2 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
                Đánh giá sản phẩm
              </h2>
              <div className="flex items-center gap-4 mb-10">
                <div className="text-5xl font-light text-slate-900">{product.rating_avg > 0 ? product.rating_avg.toFixed(1) : "0"}</div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className={star <= Math.round(product.rating_avg) ? "text-slate-900 fill-slate-900" : "text-slate-200"} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{product.rating_count} đánh giá</p>
                </div>
              </div>

              {user ? (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <p className="font-medium text-slate-900 mb-4">Viết đánh giá của bạn</p>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                        <Star size={24} className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Sản phẩm này có đáp ứng kỳ vọng của bạn không?"
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-1 focus:ring-slate-900 focus:border-slate-900 mb-6 outline-none text-sm font-light resize-none transition-shadow"
                    rows={4}
                  />
                  <button type="submit" disabled={submittingReview} className="w-full bg-slate-900 text-white rounded-full py-4 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {submittingReview ? "Đang xử lý..." : "Gửi đánh giá"}
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-center">
                  <MessageSquare size={32} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-sm text-slate-600 font-light mb-6">Bạn cần đăng nhập để có thể chia sẻ trải nghiệm về sản phẩm này.</p>
                  <Link href="/auth/login" className="inline-block bg-white border border-slate-200 text-slate-900 px-8 py-3 rounded-full text-sm font-medium hover:border-slate-900 transition-colors">
                    Đăng nhập ngay
                  </Link>
                </div>
              )}
            </div>

            {/* Review List */}
            <div>
              <div className="space-y-8">
                {reviews.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-light">Sản phẩm này chưa có đánh giá nào.</p>
                    <p className="text-slate-400 font-light mt-1">Hãy là người đầu tiên chia sẻ cảm nhận của bạn!</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="pb-8 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-medium text-lg border border-slate-200">
                            {rev.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{rev.user_name}</p>
                            <span className="text-xs text-slate-400 font-light">
                              {new Date(rev.created_at).toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} className={star <= rev.rating ? "text-slate-900 fill-slate-900" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 font-light leading-relaxed pl-16">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
