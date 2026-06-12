"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Product } from "@/types";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, PackageOpen } from "lucide-react";
import toast from "react-hot-toast";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/products?page_size=50&q=${search}`)
      .then((res) => setProducts(res.data.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá sản phẩm này?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Đã xoá sản phẩm");
      fetchProducts();
    } catch (err) {
      toast.error("Xoá thất bại");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Sản phẩm</h1>
          <p className="text-gray-500 mt-1">Danh sách sản phẩm hiện có trong hệ thống</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary gap-2">
          <Plus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="input pl-10 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá cơ bản</th>
                <th className="px-6 py-4">Biến thể</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Đang tải...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <PackageOpen size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Chưa có sản phẩm nào</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0] || "https://via.placeholder.com/40"}
                          className="w-10 h-10 rounded object-cover bg-gray-100"
                          alt=""
                        />
                        <div className="font-semibold text-gray-900 max-w-[200px] truncate">
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{PRODUCT_CATEGORIES.find(c => c.id === product.category)?.name || product.category}</td>
                    <td className="px-6 py-4 font-semibold text-blue-700">
                      {product.base_price.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge bg-gray-100 text-gray-600">
                        {product.variants.length} biến thể
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col gap-1 items-start">
                      <span className={`badge ${product.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {product.is_active ? "Đang bán" : "Đã ẩn"}
                      </span>
                      {(() => {
                        const totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
                        if (totalStock <= 0) {
                          return <span className="badge bg-orange-100 text-orange-700 mt-1">Hết hàng</span>;
                        }
                        return <span className="badge bg-blue-100 text-blue-700 mt-1">Còn {totalStock}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product._id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
