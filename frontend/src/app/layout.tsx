import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopQR — Mua sắm thông minh, thanh toán nhanh chóng",
  description: "Nền tảng thương mại điện tử với thanh toán QR Code động, hỗ trợ VietQR, MoMo, ZaloPay.",
  keywords: "mua sắm online, thanh toán QR, VietQR, ecommerce",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            success: { style: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" } },
            error: { style: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" } },
          }}
        />
      </body>
    </html>
  );
}
