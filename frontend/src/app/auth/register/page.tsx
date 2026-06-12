"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2, "Họ tên ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({ full_name: data.full_name, email: data.email, password: data.password, phone: data.phone });
      toast.success("Đăng ký thành công! Chào mừng bạn đến với ShopQR 🎉");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Tham gia ShopQR ngay hôm nay</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: "full_name", label: "Họ và tên", type: "text", placeholder: "Nguyễn Văn A" },
            { name: "email", label: "Email", type: "email", placeholder: "email@example.com" },
            { name: "phone", label: "Số điện thoại (tuỳ chọn)", type: "tel", placeholder: "0912345678" },
            { name: "password", label: "Mật khẩu", type: "password", placeholder: "Ít nhất 6 ký tự" },
            { name: "confirm_password", label: "Xác nhận mật khẩu", type: "password", placeholder: "Nhập lại mật khẩu" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <input
                {...register(field.name as keyof RegisterForm)}
                type={field.type}
                placeholder={field.placeholder}
                className="input"
              />
              {errors[field.name as keyof RegisterForm] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[field.name as keyof RegisterForm]?.message}
                </p>
              )}
            </div>
          ))}

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang đăng ký...
              </span>
            ) : "Đăng ký"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
