"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, Clock, ArrowRight, Loader2, Calendar, Database } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  orders_today: number;
  orders_month: number;
  orders_pending: number;
  total_revenue: number;
  revenue_month: number;
  top_products: { _id: string; name: string; images: string[]; base_price: number; sold_count: number; category: string }[];
  total_products: number;
  total_users: number;
}

type TimeRange = '24h' | '7d' | '30d';

// Mock data cho biểu đồ
const mockChartData = {
  '24h': {
    label: "24 giờ qua",
    revenue: [
      { name: '00:00', total: 0 }, { name: '04:00', total: 150000 }, { name: '08:00', total: 450000 },
      { name: '12:00', total: 1200000 }, { name: '16:00', total: 800000 }, { name: '20:00', total: 2100000 },
      { name: '23:59', total: 500000 }
    ],
    visits: [
      { name: '00:00', visitors: 10 }, { name: '04:00', visitors: 5 }, { name: '08:00', visitors: 45 },
      { name: '12:00', visitors: 120 }, { name: '16:00', visitors: 80 }, { name: '20:00', visitors: 200 },
      { name: '23:59', visitors: 60 }
    ]
  },
  '7d': {
    label: "7 ngày qua",
    revenue: [
      { name: 'T2', total: 1200000 }, { name: 'T3', total: 2100000 }, { name: 'T4', total: 800000 },
      { name: 'T5', total: 1600000 }, { name: 'T6', total: 2400000 }, { name: 'T7', total: 3200000 },
      { name: 'CN', total: 2800000 },
    ],
    visits: [
      { name: 'T2', visitors: 120 }, { name: 'T3', visitors: 180 }, { name: 'T4', visitors: 150 },
      { name: 'T5', visitors: 220 }, { name: 'T6', visitors: 350 }, { name: 'T7', visitors: 420 },
      { name: 'CN', visitors: 390 },
    ]
  },
  '30d': {
    label: "30 ngày qua",
    revenue: [
      { name: 'Tuần 1', total: 8500000 }, { name: 'Tuần 2', total: 12400000 },
      { name: 'Tuần 3', total: 9800000 }, { name: 'Tuần 4', total: 15200000 }
    ],
    visits: [
      { name: 'Tuần 1', visitors: 1200 }, { name: 'Tuần 2', visitors: 1800 },
      { name: 'Tuần 3', visitors: 1500 }, { name: 'Tuần 4', visitors: 2200 }
    ]
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  // Real data state
  const [useRealData, setUseRealData] = useState(false);
  const [realChartData, setRealChartData] = useState<{revenue: any[], visits: any[]} | null>(null);
  const [loadingCharts, setLoadingCharts] = useState(false);

  useEffect(() => {
    api.get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (useRealData) {
      setLoadingCharts(true);
      api.get(`/admin/charts?time_range=${timeRange}`)
        .then((res) => setRealChartData(res.data))
        .catch(() => {
          // Xử lý lỗi nếu backend không kết nối được
          setUseRealData(false); 
        })
        .finally(() => setLoadingCharts(false));
    }
  }, [timeRange, useRealData]);

  const statCards = stats ? [
    {
      label: "Đơn hàng hôm nay",
      value: stats.orders_today,
      sub: `${stats.orders_month} đơn tháng này`,
      icon: ShoppingBag,
      color: "#4f46e5",
      bg: "#eef2ff",
      border: "#4f46e5",
    },
    {
      label: "Chờ xử lý",
      value: stats.orders_pending,
      sub: "Cần xử lý ngay",
      icon: Clock,
      color: "#f97316",
      bg: "#fff7ed",
      border: "#f97316",
    },
    {
      label: "Doanh thu tháng",
      value: stats.revenue_month.toLocaleString("vi-VN") + "đ",
      sub: `Tổng: ${(stats.total_revenue / 1_000_000).toFixed(1)}M đ`,
      icon: DollarSign,
      color: "#059669",
      bg: "#ecfdf5",
      border: "#059669",
    },
    {
      label: "Sản phẩm / Khách",
      value: `${stats.total_products} / ${stats.total_users}`,
      sub: "Sản phẩm đang bán",
      icon: Users,
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#7c3aed",
    },
  ] : [];

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-black text-slate-900 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng quan</h1>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 h-32 shimmer" />
          ))}
        </div>
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  const currentLabel = mockChartData[timeRange].label;
  const currentData = {
    revenue: useRealData && realChartData ? realChartData.revenue : mockChartData[timeRange].revenue,
    visits: useRealData && realChartData ? realChartData.visits : mockChartData[timeRange].visits,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tổng quan</h1>
          <p className="text-slate-500 text-sm mt-1">Chào mừng trở lại! Đây là tình hình hôm nay.</p>
        </div>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="card p-5 hover:shadow-md transition-shadow"
            style={{ borderTop: `3px solid ${card.border}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <p className="text-2xl font-black text-slate-900">{card.value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Section Header with Filter and Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-900 text-lg">Phân tích hiệu suất</h2>
          
          {/* Toggle Real Data Button */}
          <button 
            onClick={() => setUseRealData(!useRealData)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              useRealData 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Database size={14} className={useRealData ? 'text-emerald-500' : 'text-slate-400'} />
            {useRealData ? 'Đang dùng dữ liệu thực' : 'Bật dữ liệu thực'}
          </button>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeRange === '24h' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            24 giờ
          </button>
          <button 
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeRange === '7d' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            7 ngày
          </button>
          <button 
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeRange === '30d' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            30 ngày
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Doanh thu Chart */}
        <div className="card p-6 relative">
          {loadingCharts && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          )}
          <div className="flex flex-col mb-6">
            <h2 className="font-bold text-slate-900 text-base">Biểu đồ Doanh thu</h2>
            <p className="text-xs text-slate-400 mt-1">Tổng quan doanh thu {currentLabel.toLowerCase()}</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value/1000}k`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic/Visitors Chart */}
        <div className="card p-6 relative">
          {loadingCharts && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          )}
          <div className="flex flex-col mb-6">
            <h2 className="font-bold text-slate-900 text-base">Lượng người tiếp cận</h2>
            <p className="text-xs text-slate-400 mt-1">Số lượt truy cập trang web {currentLabel.toLowerCase()}</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData.visits} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <RechartsTooltip 
                  formatter={(value: number) => [value, "Lượt truy cập"]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="visitors" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick actions + Top products */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4 text-base">Hành động nhanh</h2>
          <div className="space-y-3">
            <Link href="/admin/products/new"
              className="flex items-center justify-between p-4 rounded-xl hover:bg-indigo-50 transition-all group border border-slate-100 hover:border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-100">
                  <Package size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Thêm sản phẩm mới</p>
                  <p className="text-xs text-slate-400">Tạo sản phẩm với variants và ảnh</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
            <Link href="/admin/orders"
              className="flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 transition-all group border border-slate-100 hover:border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-100">
                  <ShoppingBag size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Xem đơn hàng</p>
                  <p className="text-xs text-slate-400">{stats?.orders_pending || 0} đơn đang chờ xử lý</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-orange-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Top products */}
        {stats && stats.top_products.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">🏆 Sản phẩm bán chạy</h2>
              <Link href="/admin/products" className="text-xs text-indigo-600 hover:underline font-medium">Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {stats.top_products.slice(0, 4).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                    i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-slate-200"
                  }`} style={{ color: i >= 3 ? "#94a3b8" : undefined }}>
                    {i + 1}
                  </span>
                  <img src={p.images?.[0] || ""} alt=""
                    className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.base_price.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 shrink-0">{p.sold_count} đã bán</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


