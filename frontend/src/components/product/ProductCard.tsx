"use client";

import Link from "next/link";
import { Product } from "@/types";
import { ShoppingBag, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : product.base_price;

  const totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const isOutOfStock = totalStock <= 0;

  const firstVariant = product.variants[0];
  const isHot = product.sold_count > 50;
  const isTrending = product.sold_count > 20 && !isHot;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("Sản phẩm này đã hết hàng");
      return;
    }
    if (!firstVariant) {
      toast.error("Sản phẩm này chưa có biến thể");
      return;
    }
    addItem({
      product_id: product._id,
      product_name: product.name,
      image: product.images[0] || "",
      sku: firstVariant.sku,
      variant_info: { size: firstVariant.size, color: firstVariant.color },
      quantity: 1,
      unit_price: firstVariant.price,
      subtotal: firstVariant.price,
    });
    toast.success(`Đã thêm vào giỏ hàng!`, { 
      icon: '🛒',
      style: { borderRadius: '100px', background: '#333', color: '#fff' }
    });
  };

  return (
    <div className="group relative flex flex-col h-full bg-transparent">
      {/* Image container - 3:4 Aspect Ratio commonly used in Premium Shopify themes */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-slate-50 mb-5 border border-slate-100/60">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-slate-200" />
          </div>
        )}

        {/* Badges - Minimalist */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isHot && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white">
              Bán chạy
            </span>
          )}
          {product.is_featured && !isHot && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-slate-900 shadow-sm border border-slate-100">
              Nổi bật
            </span>
          )}
        </div>

        {/* Quick Add Button - Desktop hover / Mobile visible via logic if needed */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 px-5">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-3.5 px-4 rounded-full text-sm font-medium transition-all shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md flex items-center justify-center gap-2
              ${isOutOfStock 
                ? 'bg-slate-200/80 text-slate-500 cursor-not-allowed' 
                : 'bg-white/95 text-slate-900 hover:bg-slate-900 hover:text-white hover:scale-[1.02]'}`}
          >
            <ShoppingBag size={16} />
            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>

      {/* Info - Clean Typography */}
      <div className="flex flex-col flex-1 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
          {product.category}
        </p>
        
        <h3 className="font-medium text-slate-900 text-sm leading-relaxed mb-2 group-hover:text-slate-500 transition-colors">
          <Link href={`/products/${product.slug || product._id}`}>
            <span className="absolute inset-0 z-10" />
            {product.name}
          </Link>
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-slate-900 tracking-tight">
              {lowestPrice.toLocaleString("vi-VN")}đ
            </span>
            {product.variants.length > 1 && (
              <span className="text-xs text-slate-400 font-light">+</span>
            )}
          </div>
          
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1.5 z-20">
              <Star size={12} className="text-slate-900 fill-slate-900" />
              <span className="text-xs font-medium text-slate-600">{product.rating_avg.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
