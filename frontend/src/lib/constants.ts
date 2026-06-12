import { Laptop, Smartphone, Headphones, Monitor, Watch } from "lucide-react";

export const PRODUCT_CATEGORIES = [
  { id: "laptop", name: "Laptops", icon: Laptop, color: "bg-blue-50 text-blue-600", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80", badge: "🔥 Phổ biến nhất" },
  { id: "phone", name: "Điện thoại", icon: Smartphone, color: "bg-purple-50 text-purple-600", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80", badge: "Trending" },
  { id: "accessory", name: "Phụ kiện", icon: Headphones, color: "bg-rose-50 text-rose-600", image: "https://images.unsplash.com/photo-1572569433114-699233054f16?w=500&q=80" },
  { id: "monitor", name: "Màn hình", icon: Monitor, color: "bg-orange-50 text-orange-600", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80" },
  { id: "smart", name: "Thiết bị thông minh", icon: Watch, color: "bg-emerald-50 text-emerald-600", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80" },
];
