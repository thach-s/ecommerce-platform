import Link from "next/link";
import { QrCode, Facebook, Twitter, Instagram, Youtube, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-6 w-fit">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105">
                <QrCode size={16} className="text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                ShopQR
              </span>
            </Link>
            <p className="text-slate-500 font-light leading-relaxed mb-8 max-w-sm">
              Nền tảng thương mại điện tử thế hệ mới. Tiên phong áp dụng thanh toán QR Code tự động, mang đến trải nghiệm mua sắm không độ trễ.
            </p>
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-900">Theo dõi chúng tôi</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-6 uppercase tracking-wider text-xs">Sản phẩm</h3>
            <ul className="space-y-4">
              {['Điện thoại di động', 'Laptop & Macbook', 'Thiết bị thông minh', 'Phụ kiện công nghệ', 'Máy tính bảng', 'Đồng hồ thông minh'].map((link, i) => (
                <li key={i}>
                  <Link href="/products" className="text-slate-500 hover:text-slate-900 font-light text-sm transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-6 uppercase tracking-wider text-xs">Hỗ trợ</h3>
            <ul className="space-y-4">
              {['Trung tâm trợ giúp', 'Hướng dẫn mua hàng', 'Phương thức thanh toán', 'Tra cứu đơn hàng', 'Chính sách bảo hành', 'Liên hệ'].map((link, i) => (
                <li key={i}>
                  <Link href="#" className="text-slate-500 hover:text-slate-900 font-light text-sm transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-6 uppercase tracking-wider text-xs">Chính sách</h3>
            <ul className="space-y-4">
              {['Điều khoản sử dụng', 'Chính sách bảo mật', 'Chính sách vận chuyển', 'Chính sách đổi trả', 'Bảo mật thanh toán'].map((link, i) => (
                <li key={i}>
                  <Link href="#" className="text-slate-500 hover:text-slate-900 font-light text-sm transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Newsletter */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 mb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
          <div className="relative z-10 md:w-1/2">
            <h3 className="text-3xl font-medium text-white mb-4">Đăng ký nhận tin tức</h3>
            <p className="text-slate-400 font-light">Nhận ngay mã giảm giá 10% cho đơn hàng đầu tiên và cập nhật sớm nhất về các sản phẩm mới.</p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex-1 max-w-md">
            <form className="relative flex items-center">
              <input 
                type="email" 
                placeholder="Nhập email của bạn..." 
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-500 px-6 py-4 rounded-full outline-none focus:border-white/40 transition-colors"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 bg-white text-slate-900 px-6 rounded-full font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
                Đăng ký <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 font-light text-sm">
            © 2026 ShopQR. Tất cả các quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Visa_Logo.png/800px-Visa_Logo.png" alt="Visa" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/800px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5 opacity-50 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}
