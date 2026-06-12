"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, Box } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const CATEGORIES = [{ id: "all", name: "Tất cả" }, ...PRODUCT_CATEGORIES];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sortBy = searchParams.get("sort") || "created_at";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "16", // Premium themes often show more items (4x4 grid)
        sort_by: sortBy,
        order: "desc",
        ...(q && { q }),
        ...(category && category !== "all" && { category }),
      });
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, category, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <div className="bg-slate-50 py-20 px-6 sm:px-12 border-b border-slate-100">
        <div className="max-w-[90rem] mx-auto text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400 mb-4">
            Bộ sưu tập
          </p>
          <h1 className="text-4xl md:text-5xl font-medium text-slate-900 tracking-tight">
            {category && category !== "all" ? CATEGORIES.find(c => c.id === category)?.name : "Tất cả sản phẩm"}
          </h1>
          {total > 0 && <p className="text-slate-500 mt-4 font-light">{total} sản phẩm tìm thấy</p>}
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 py-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-6">
          {/* Categories */}
          <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = (cat.id === "all" && !category) || cat.id === category;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateParams({ category: cat.id === "all" ? "" : cat.id })}
                  className={`shrink-0 text-sm transition-all whitespace-nowrap border-b-2 pb-1 ${
                    isActive
                      ? "font-medium text-slate-900 border-slate-900"
                      : "text-slate-500 font-light border-transparent hover:text-slate-900"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs tracking-widest uppercase font-semibold text-slate-400">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-transparent text-sm font-medium text-slate-900 border-none outline-none cursor-pointer focus:ring-0 pr-8"
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
            >
              <option value="created_at">Mới nhất</option>
              <option value="sold_count">Bán chạy nhất</option>
              <option value="base_price">Giá tăng dần</option>
              <option value="rating_avg">Đánh giá cao</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-slate-100 rounded-[1.5rem] mb-5" />
                <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((p, i) => (
              <div key={p._id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out" style={{ animationDelay: `${(i % 4) * 100}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center">
            <Box size={48} className="text-slate-300 mb-6" />
            <p className="text-xl text-slate-500 font-light mb-8">Chưa có sản phẩm trong bộ sưu tập này.</p>
            <button onClick={() => router.push("/products")} className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-full font-medium hover:bg-slate-50 transition-colors">
              Xem tất cả sản phẩm
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-24">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex gap-2 mx-4">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParams({ page: String(p) })}
                  className={`w-12 h-12 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    p === page ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
