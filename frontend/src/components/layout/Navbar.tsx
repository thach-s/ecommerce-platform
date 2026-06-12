"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ShoppingBag, QrCode, Menu, X, LogOut, Package, Settings, User, Search, Loader2, History } from "lucide-react";
import toast from "react-hot-toast";
import { useSearch } from "@/hooks/useSearch";

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="text-slate-900 font-bold bg-slate-100">{part}</span> : part
      )}
    </span>
  );
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  // Search state
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { query, setQuery, suggestions, loading, history, saveHistory, removeHistoryItem, clearHistory } = useSearch('');

  const { items, totalItems } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prevCount, setPrevCount] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    const count = totalItems();
    if (count > prevCount) {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 500);
    }
    setPrevCount(count);
  }, [mounted ? totalItems() : 0]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    toast.success("Đã đăng xuất");
  };

  const executeSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    saveHistory(searchTerm);
    setSearchFocused(false);
    setMenuOpen(false);
    router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const cartCount = mounted ? totalItems() : 0;
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "";

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/#categories", label: "Danh mục" },
    { href: "/#promotions", label: "Khuyến mãi" },
    { href: "/orders", label: "Tra cứu đơn hàng" },
    { href: "/contact", label: "Liên hệ" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md"
            : "bg-white/80 border-b border-slate-100 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
          <div className="flex items-center justify-between h-20 gap-8">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105">
                <QrCode size={16} className="text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 hidden sm:block">
                S-QR
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-6 shrink-0">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/" && !link.href.startsWith("/#"));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-all hover:text-slate-900 relative py-2 ${
                      isActive ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Global Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative group z-50">
                <div className={`flex items-center bg-slate-50 hover:bg-slate-100 transition-colors rounded-full border ${searchFocused ? 'border-slate-300 bg-white shadow-sm' : 'border-transparent'}`}>
                  <div className="pl-5 pr-3 py-2.5">
                    {loading ? <Loader2 size={16} className="text-slate-400 animate-spin" /> : <Search size={16} className="text-slate-400" />}
                  </div>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Tìm kiếm sản phẩm, bộ sưu tập..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 pr-5 text-slate-900 placeholder:text-slate-400 placeholder:font-light outline-none"
                  />
                  {query && (
                    <button type="button" onClick={() => { setQuery(''); searchRef.current?.querySelector('input')?.focus(); }} className="p-2 mr-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Search Dropdown */}
                {searchFocused && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50">
                    {query.trim() !== '' ? (
                      <div className="max-h-[60vh] overflow-y-auto py-4 custom-scrollbar">
                        {suggestions.length > 0 ? (
                          <>
                            <div className="px-6 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                              Kết quả tìm kiếm
                            </div>
                            <div className="px-3">
                              {suggestions.map((item) => (
                                <button
                                  key={item._id}
                                  type="button"
                                  onClick={() => executeSearch(item.name)}
                                  className="w-full text-left p-3 hover:bg-slate-50 rounded-2xl transition-colors flex items-center gap-4 group"
                                >
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-12 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100" />
                                  ) : (
                                    <div className="w-12 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                      <Package size={16} className="text-slate-300" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 group-hover:text-slate-600 transition-colors">
                                      {highlightText(item.name, query)}
                                    </p>
                                    <p className="text-xs text-slate-500 font-light mt-1">{item.price.toLocaleString("vi-VN")}đ</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="px-6 pt-4 mt-2 border-t border-slate-50">
                              <button
                                type="button"
                                onClick={() => executeSearch(query)}
                                className="w-full py-3 text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                              >
                                Xem tất cả kết quả cho "{query}" <ArrowRight size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          !loading && (
                            <div className="px-6 py-12 text-center">
                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={20} className="text-slate-300" />
                              </div>
                              <p className="text-sm font-medium text-slate-900 mb-1">Không tìm thấy "{query}"</p>
                              <p className="text-xs text-slate-500 font-light">Vui lòng thử lại với từ khóa khác.</p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="py-4">
                        {history.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between px-6 py-2 mb-2">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Tìm kiếm gần đây</span>
                              <button onClick={clearHistory} className="text-[10px] text-slate-400 hover:text-slate-900 font-medium uppercase tracking-widest transition-colors">Xoá tất cả</button>
                            </div>
                            <div className="px-3">
                              {history.map((term, i) => (
                                <div key={i} className="flex items-center justify-between px-3 hover:bg-slate-50 rounded-xl transition-colors group">
                                  <button
                                    type="button"
                                    onClick={() => executeSearch(term)}
                                    className="flex-1 text-left py-3 flex items-center gap-3"
                                  >
                                    <History size={14} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{term}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeHistoryItem(term); }}
                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="px-6 py-8 text-center">
                            <p className="text-xs text-slate-400 font-light">Lịch sử tìm kiếm trống.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-4 shrink-0">
              
              <button 
                onClick={() => setSearchFocused(!searchFocused)}
                className="md:hidden p-2 rounded-full text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 rounded-full text-slate-900 hover:bg-slate-50 transition-colors">
                <ShoppingBag size={20} strokeWidth={1.5} className={cartBump ? "scale-125 transition-transform" : "transition-transform"} />
                {cartCount > 0 && (
                  <span className={`absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-slate-900 text-white transition-transform ${cartBump ? "scale-125" : "scale-100"}`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              <div className="hidden sm:block border-l border-slate-200 h-6 mx-2" />

              {!mounted ? (
                <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse hidden sm:block" />
              ) : isAuthenticated && user ? (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
                      {user.full_name.split(" ").pop()}
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-20 p-2">
                        <div className="p-4 mb-2">
                          <p className="font-medium text-slate-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500 font-light truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="space-y-1">
                          <Link href="/profile" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <User size={16} strokeWidth={1.5} /> Tài khoản
                          </Link>
                          <Link href="/orders" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <Package size={16} strokeWidth={1.5} /> Đơn hàng
                          </Link>
                          {user.role === "admin" && (
                            <Link href="/admin" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                              <Settings size={16} strokeWidth={1.5} /> Quản trị
                            </Link>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                            <LogOut size={16} strokeWidth={1.5} /> Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Đăng nhập
                  </Link>
                  <Link href="/auth/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-full text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 p-6 shadow-xl z-50 min-h-screen">
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-2xl font-medium text-slate-900 py-2">
                  {link.label}
                </Link>
              ))}
              
              <div className="h-px bg-slate-100 my-6" />
              
              {isAuthenticated && user ? (
                <>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-slate-600 py-2">Tài khoản</Link>
                  <button onClick={handleLogout} className="block text-lg font-medium text-red-600 py-2 w-full text-left">Đăng xuất</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-slate-600 py-2">Đăng nhập</Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="block text-lg font-medium text-slate-600 py-2">Đăng ký mới</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}

// Dummy icon to resolve ArrowRight warning
import { ArrowRight } from "lucide-react";
