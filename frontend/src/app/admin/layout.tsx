"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag, LayoutDashboard, ArrowLeft, ChevronRight } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) router.push("/auth/login?redirect=/admin");
      else if (user?.role !== "admin") router.push("/");
    }
  }, [isAuthenticated, user, router, mounted]);

  if (!mounted || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
        <div className="w-10 h-10 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
      </div>
    );
  }

  const menu = [
    { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
    { name: "Sản phẩm", path: "/admin/products", icon: Package },
    { name: "Đơn hàng", path: "/admin/orders", icon: ShoppingBag },
  ];

  const initials = user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0f0e1a" }}>
      {/* Sidebar */}
      <div className="w-60 flex flex-col shrink-0" style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Admin Panel</p>
              <p className="text-indigo-300 text-xs">ShopQR Management</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
              <p className="text-indigo-300 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
                  isActive
                    ? "text-white"
                    : "text-indigo-200/70 hover:text-white hover:bg-white/5"
                }`}
                style={isActive ? {
                  background: "rgba(255,255,255,0.15)",
                  boxShadow: "0 0 20px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                } : {}}>
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  {item.name}
                </div>
                {isActive && <ChevronRight size={14} className="text-indigo-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Back to store */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Link href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-200/70 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={14} /> Quay lại cửa hàng
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto" style={{ background: "#f8fafc" }}>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
