"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Product } from "@/types";
import { 
  ArrowRight, QrCode, Zap, ShieldCheck, Box, ShoppingCart, 
  ChevronRight, Star, Heart, Eye, Smartphone, Laptop, 
  Headphones, Monitor, Watch, Quote, Plus, Minus, Search, 
  MapPin, CheckCircle, CreditCard, Lock
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

// --- Components ---

const AnimatedCounter = ({ end, suffix = "", prefix = "" }: { end: number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, isVisible]);

  return <div ref={nodeRef} className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">{prefix}{count.toLocaleString("vi-VN")}{suffix}</div>;
};

const PremiumProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);
  const discount = Math.floor(Math.random() * 20) + 5; // Fake discount
  const rating = (Math.random() * 1 + 4).toFixed(1); // Fake rating 4.0 - 5.0
  const reviewsCount = Math.floor(Math.random() * 500) + 50;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.variants.length > 0) {
      addItem({
        product_id: product._id,
        product_name: product.name,
        sku: product.variants[0].sku,
        variant_info: { size: product.variants[0].size, color: product.variants[0].color },
        quantity: 1,
        unit_price: product.variants[0].price,
        subtotal: product.variants[0].price,
        image: product.images[0]
      });
    }
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">-{discount}%</span>
        <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">Mới</span>
      </div>
      
      {/* Wishlist Button */}
      <button className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white shadow-sm transition-all">
        <Heart size={16} />
      </button>

      {/* Image */}
      <Link href={`/products/${product._id}`} className="block relative aspect-[4/5] bg-slate-50 overflow-hidden">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Box size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Quick Actions (Hover) */}
        <div className={`absolute bottom-4 left-4 right-4 flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button 
            onClick={handleAddToCart}
            className="flex-1 bg-white text-slate-900 py-3 rounded-xl text-sm font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} /> Thêm giỏ hàng
          </button>
          <button className="w-12 h-12 bg-white text-slate-900 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0">
            <Eye size={18} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex text-yellow-400"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
          <span className="text-xs font-medium text-slate-400">({reviewsCount})</span>
        </div>
        <Link href={`/products/${product._id}`}>
          <h3 className="font-semibold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-slate-400 line-through mb-0.5">{(product.variants?.[0]?.price * (1 + discount/100)).toLocaleString("vi-VN")}đ</p>
            <p className="font-bold text-slate-900 text-lg">{(product.variants?.[0]?.price || 0).toLocaleString("vi-VN")}đ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none"
      >
        <span className="text-lg font-medium text-slate-900 pr-8">{question}</span>
        <span className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400'}`}>
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 font-light leading-relaxed pr-12">{answer}</p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    api.get("/products?page_size=16&sort_by=sold_count")
      .then((res) => setAllProducts(res.data.items || []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = activeCategory 
    ? allProducts.filter(p => p.category === activeCategory)
    : allProducts;

  const categoriesWithCount = PRODUCT_CATEGORIES.map(cat => ({
    ...cat,
    count: allProducts.filter(p => p.category === cat.id).length
  }));

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50">
        {/* Premium Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] opacity-30 bg-gradient-to-b from-indigo-200 via-white to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none" />
        
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/60 shadow-sm mb-8 animate-fade-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">Thanh toán QR Tức thì</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-medium leading-[1.1] tracking-[-0.03em] text-slate-900 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
                Mua sắm. Quét mã.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Sở hữu ngay.</span>
              </h1>
              
              <p className="text-xl text-slate-500 font-light leading-relaxed mb-10 max-w-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
                Trải nghiệm chuẩn mực thương mại điện tử thế hệ mới. Lựa chọn sản phẩm cao cấp, thanh toán tự động qua mã QR chuẩn ngân hàng mà không cần ví điện tử trung gian.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
                <Link href="/products" className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full text-base font-medium transition-all hover:bg-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 w-full sm:w-auto">
                  Khám phá Sản phẩm <ArrowRight size={18} />
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full text-base font-medium transition-all hover:border-slate-300 hover:bg-slate-50 w-full sm:w-auto">
                  Cách hoạt động
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white bg-slate-100" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-xs font-medium text-slate-500">Hơn 10,000+ khách hàng tin dùng</p>
                </div>
              </div>
            </div>

            {/* Right Graphic - Interactive Realistic Mockup */}
            <div className="relative animate-fade-up lg:ml-auto w-full max-w-lg" style={{ animationDelay: '300ms' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-[3rem] rotate-3 scale-105 opacity-50" />
              <div className="relative bg-white p-4 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100/50">
                {/* Mockup Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center"><QrCode size={14} className="text-white" /></div>
                    <span className="font-semibold text-sm">ShopQR Checkout</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-green-500 uppercase bg-green-50 px-2 py-1 rounded-full">Secure</span>
                </div>
                
                {/* Mockup Content */}
                <div className="bg-slate-50 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                    <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=150&q=80" alt="Product" className="w-12 h-12 object-cover rounded-xl" />
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Thanh toán đơn hàng</p>
                  <p className="text-3xl font-black text-slate-900 mb-6">24.500.000đ</p>
                  
                  <div className="bg-white p-4 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.04)] inline-block relative">
                    <QrCode size={120} className="text-slate-900" />
                    {/* Scanner Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
                    <Lock size={12} /> Mã hoá đầu cuối chuẩn NAPAS
                  </p>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-8 top-20 bg-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center gap-3 animate-[bounce_4s_infinite]">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={16} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-light">Giao dịch</p>
                  <p className="text-sm font-bold text-slate-900">Thành công</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TRUST BUILDING (Stats) */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 divide-x divide-slate-100">
            <div className="text-center px-4">
              <AnimatedCounter end={150} suffix="K+" />
              <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">Đơn hàng</p>
            </div>
            <div className="text-center px-4">
              <AnimatedCounter end={98} suffix="%" />
              <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">Hài lòng</p>
            </div>
            <div className="text-center px-4">
              <AnimatedCounter end={45} suffix="M+" />
              <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">Khách hàng</p>
            </div>
            <div className="text-center px-4">
              <AnimatedCounter end={0} suffix="s" prefix="<" />
              <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">Độ trễ xử lý</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CATEGORY SECTION */}
      <section className="py-32 bg-slate-50" id="categories">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-4">Danh mục sản phẩm</h2>
              <p className="text-slate-500 font-light text-lg max-w-2xl">Khám phá các thiết bị công nghệ phù hợp với nhu cầu của bạn</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100">
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>

          {/* Cards Container - Horizontal Scroll on Mobile, Grid on Tablet/Desktop */}
          <div className="flex overflow-x-auto pb-8 -mx-6 px-6 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:px-0 md:pb-0 gap-6 snap-x snap-mandatory hide-scrollbar">
            {categoriesWithCount.map((cat, i) => {
              const isActive = activeCategory === cat.id;
              
              return (
                <button 
                  key={i} 
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`relative text-left group flex-shrink-0 w-[280px] md:w-auto h-[360px] rounded-[24px] overflow-hidden transition-all duration-300 snap-center focus:outline-none ${
                    isActive 
                      ? 'shadow-[0_20px_50px_-12px_rgba(37,99,235,0.25)] -translate-y-2' 
                      : 'shadow-sm border border-slate-200/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2'
                  }`}
                >
                  {/* Gradient Border for Active State */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#06B6D4] p-[2px] rounded-[24px] z-20 pointer-events-none">
                      <div className="w-full h-full bg-white rounded-[22px]" />
                    </div>
                  )}

                  <div className="relative w-full h-full bg-white z-10 flex flex-col rounded-[22px] overflow-hidden">
                    {/* Image Area - 70% Height */}
                    <div className="relative h-[70%] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-[400ms] ease-out ${
                          isActive ? 'scale-105' : 'group-hover:scale-105'
                        }`} 
                      />
                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-90" />
                      
                      {/* Special Badges */}
                      {cat.badge && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm z-10">
                          {cat.badge}
                        </div>
                      )}

                      {/* Floating Icon */}
                      <div className={`absolute bottom-4 left-5 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-300 z-10 ${
                        isActive ? 'bg-[#2563EB] text-white' : 'bg-white/20 text-white border border-white/20 group-hover:bg-white group-hover:text-slate-900'
                      }`}>
                        <cat.icon size={18} strokeWidth={2} />
                      </div>
                    </div>

                    {/* Content Area - 30% Height */}
                    <div className="h-[30%] p-5 bg-white flex flex-col justify-center relative">
                      <h3 className={`font-bold text-lg mb-1 tracking-tight transition-colors duration-300 ${
                        isActive ? 'text-[#2563EB]' : 'text-slate-900 group-hover:text-[#2563EB]'
                      }`}>
                        {cat.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                          {cat.count} sản phẩm
                        </p>
                        
                        {/* Reveal CTA Animation */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out bg-slate-50 text-slate-400 group-hover:bg-[#2563EB] group-hover:text-white ${
                          isActive ? 'bg-[#2563EB] text-white opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'
                        }`}>
                          <ArrowRight size={14} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />
        </div>
      </section>

      {/* 7 & 9. PRODUCT SHOWCASE & BEST SELLERS */}
      <section className="py-32 bg-white min-h-[800px]" id="promotions">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-6">
              {activeCategory ? `Sản phẩm ${PRODUCT_CATEGORIES.find(c => c.id === activeCategory)?.name}` : 'Sản phẩm nổi bật'}
            </h2>
            <p className="text-lg text-slate-500 font-light leading-relaxed">
              Những sản phẩm công nghệ được săn đón nhất tuần qua. Thiết kế đẳng cấp, hiệu năng vượt trội.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-100 aspect-[4/5] rounded-[1.5rem] mb-4" />
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-6 bg-slate-100 rounded w-3/4 mb-4" />
                  <div className="h-5 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 8).map((p) => (
                    <div key={p._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                      <PremiumProductCard product={p} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-slate-50 rounded-[2rem] border border-slate-100 animate-in fade-in duration-500">
                    <Box size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg font-medium">Không tìm thấy sản phẩm</p>
                    <p className="text-slate-400 font-light mt-1">Danh mục này hiện chưa có sản phẩm nào phù hợp.</p>
                    <button 
                      onClick={() => setActiveCategory(null)}
                      className="mt-6 text-indigo-600 font-medium hover:text-indigo-700 underline underline-offset-4"
                    >
                      Xem tất cả sản phẩm
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-20 text-center">
                <Link href="/products" className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-200 px-10 py-4 rounded-full text-base font-semibold transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                  Xem toàn bộ cửa hàng <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 6. SHOPPING PROCESS */}
      <section id="how-it-works" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-20">
            <h2 className="text-3xl lg:text-5xl font-medium tracking-tight mb-6">Trải nghiệm mua sắm<br/>tinh gọn nhất.</h2>
            <p className="text-slate-400 font-light text-lg max-w-xl">Quy trình 4 bước đơn giản, minh bạch và hoàn toàn tự động. Không cần điền form, không cần chờ đợi xác nhận thủ công.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-slate-800" />
            
            {[
              { step: "01", title: "Chọn sản phẩm", desc: "Duyệt qua danh mục và thêm vào giỏ hàng." },
              { step: "02", title: "Quét mã QR", desc: "Hệ thống sinh mã VietQR động cùng số tiền chuẩn xác." },
              { step: "03", title: "Xác nhận tức thì", desc: "Giao dịch được đối soát tự động qua OpenBanking trong 1s." },
              { step: "04", title: "Nhận hàng", desc: "Đơn hàng tự động chuyển sang trạng thái chờ giao." },
            ].map((item, i) => (
              <div key={i} className="relative z-10">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-2xl font-bold text-slate-300 mb-8 border-8 border-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                  {item.step}
                </div>
                <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-6">Giá trị cốt lõi</h2>
            <p className="text-lg text-slate-500 font-light">Chúng tôi xây dựng nền tảng dựa trên sự an toàn, tốc độ và trải nghiệm người dùng tuyệt hảo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Tốc độ xử lý", desc: "Mã QR được tạo theo thời gian thực (Real-time). Tiền về tài khoản, đơn hàng đổi trạng thái ngay lập tức." },
              { icon: ShieldCheck, title: "Giao dịch an toàn", desc: "Không lưu trữ số thẻ, không rủi ro rò rỉ dữ liệu. Thanh toán trực tiếp qua App ngân hàng của bạn." },
              { icon: Box, title: "Theo dõi đơn hàng", desc: "Tracking tiến trình giao hàng chi tiết từ khi đặt đến khi nhận được trên tay." },
              { icon: CreditCard, title: "100% Không tiền mặt", desc: "Loại bỏ hoàn toàn rủi ro tiền giả, thối tiền lẻ. Chỉ một lần quét là xong." },
              { icon: Lock, title: "Bảo vệ người mua", desc: "Chính sách hoàn tiền tự động 100% nếu sản phẩm không đúng mô tả hoặc hư hỏng." },
              { icon: CheckCircle, title: "Xác nhận tư động", desc: "Webhook liên tục lắng nghe thay đổi số dư từ ngân hàng và xác nhận đơn hàng mà không cần admin duyệt." },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all group">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-6 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CUSTOMER REVIEWS */}
      <section className="py-32 bg-white">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <h2 className="text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 mb-16 text-center">Khách hàng nói gì về chúng tôi</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Minh Tuấn", role: "Developer", review: "Quá trình thanh toán mượt mà khó tin. Mình chỉ việc quét mã QR và tíc tắc đơn hàng đã chuyển sang trạng thái Đã thanh toán.", avatar: "https://i.pravatar.cc/100?img=11" },
              { name: "Hải Yến", role: "Designer", review: "Giao diện website cực kỳ clean và hiện đại. Nhìn giống các trang thương mại điện tử quốc tế chứ không mang cảm giác lộn xộn thường thấy.", avatar: "https://i.pravatar.cc/100?img=5" },
              { name: "Quốc Khánh", role: "Business Owner", review: "Tôi rất thích tính năng cập nhật realtime. Không cần phải chụp ảnh màn hình chuyển khoản gửi cho shop kiểm tra nữa.", avatar: "https://i.pravatar.cc/100?img=8" },
            ].map((review, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[2rem]">
                <div className="flex text-yellow-400 mb-6"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
                <p className="text-lg text-slate-700 font-light leading-relaxed mb-8">"{review.review}"</p>
                <div className="flex items-center gap-4">
                  <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">{review.name} <CheckCircle size={14} className="text-blue-500" /></p>
                    <p className="text-sm text-slate-500 font-light">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section className="py-32 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 sm:px-12">
          <h2 className="text-3xl lg:text-4xl font-medium tracking-tight text-slate-900 mb-12 text-center">Câu hỏi thường gặp</h2>
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <FAQItem question="Thời gian xác nhận thanh toán là bao lâu?" answer="Hệ thống của chúng tôi tích hợp trực tiếp qua OpenBanking. Ngay khi giao dịch chuyển khoản của bạn thành công trên app ngân hàng, hệ thống sẽ xác nhận đơn hàng trong vòng 1-3 giây." />
            <FAQItem question="Tôi có thể đổi trả sản phẩm không?" answer="Có. Chúng tôi hỗ trợ chính sách đổi trả miễn phí trong vòng 30 ngày đối với các lỗi từ nhà sản xuất. Quá trình hoàn tiền cũng được thực hiện tự động qua tài khoản ngân hàng của bạn." />
            <FAQItem question="Làm sao để theo dõi đơn hàng?" answer="Sau khi đặt hàng, bạn có thể truy cập mục 'Đơn hàng' trong tài khoản cá nhân. Hệ thống sẽ hiển thị biểu đồ tiến trình giao hàng theo thời gian thực từ Đang xử lý đến khi Đã giao thành công." />
            <FAQItem question="Website có bảo mật thông tin thẻ của tôi không?" answer="Chúng tôi hoàn toàn không yêu cầu và không lưu trữ thông tin thẻ hay tài khoản ngân hàng của bạn. Bạn chủ động thực hiện thanh toán trên ứng dụng ngân hàng của chính mình (qua quét mã QR)." />
          </div>
        </div>
      </section>

    </div>
  );
}
