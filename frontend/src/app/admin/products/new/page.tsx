"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU là bắt buộc"),
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.coerce.number().min(1, "Giá phải lớn hơn 0"),
  stock: z.coerce.number().min(0, "Số lượng không được âm"),
});

const productSchema = z.object({
  name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự"),
  slug: z.string().min(3, "Slug là bắt buộc"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  brand: z.string().optional(),
  base_price: z.coerce.number().min(1, "Giá cơ bản phải lớn hơn 0"),
  description: z.string().min(10, "Mô tả quá ngắn"),
  short_description: z.string().optional(),
  tags: z.string().optional(),
  images: z.array(z.object({ url: z.string().url("URL không hợp lệ") })).min(1, "Ít nhất 1 hình ảnh"),
  is_featured: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "Phải có ít nhất 1 biến thể"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_featured: false,
      images: [{ url: "" }],
      variants: [{ sku: "", size: "", color: "", price: 0, stock: 10 }],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control, name: "images" });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: "variants" });

  const watchName = watch("name");

  // Auto-generate slug from name
  const generateSlug = () => {
    if (!watchName) return;
    const slug = watchName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setValue("slug", slug);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setValue(`images.${index}.url`, data.url);
      toast.success("Tải ảnh thành công!");
    } catch {
      toast.error("Tải ảnh thất bại. Nhập URL thủ công.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        tags: (data as any).tags ? (data as any).tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        images: data.images.map((img) => img.url).filter(Boolean),
      };
      await api.post("/products", payload);
      toast.success("Thêm sản phẩm thành công!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Lỗi khi thêm sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Thêm sản phẩm mới</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cột trái: Thông tin cơ bản */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-lg border-b pb-2">Thông tin chung</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                <input {...register("name")} onBlur={generateSlug} className="input" placeholder="Ví dụ: Áo thun nam" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input {...register("slug")} className="input bg-gray-50" placeholder="ao-thun-nam" />
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                  <select {...register("category")} className="input">
                    <option value="">Chọn danh mục</option>
                    <optgroup label="Thời trang">
                      <option value="Áo">Áo</option>
                      <option value="Quần">Quần</option>
                      <option value="Giày dép">Giày dép</option>
                      <option value="Phụ kiện">Phụ kiện</option>
                      <option value="Túi xách">Túi xách</option>
                    </optgroup>
                    <optgroup label="Điện tử - Điện lạnh">
                      <option value="Tivi">Tivi</option>
                      <option value="Tủ lạnh">Tủ lạnh</option>
                      <option value="Máy giặt">Máy giặt</option>
                      <option value="Điều hòa">Điều hòa</option>
                    </optgroup>
                    <optgroup label="Khác">
                      <option value="Khác">Khác</option>
                    </optgroup>
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá cơ bản (VNĐ) *</label>
                  <input type="number" {...register("base_price")} className="input" placeholder="100000" />
                  {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <input {...register("brand")} className="input" placeholder="Ví dụ: Nike" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (phân cách bởi dấu phẩy)</label>
                <input {...(register as any)("tags")} className="input" placeholder="áo thun, nam, summer..." />
                <p className="text-xs text-gray-400 mt-1">Dùng để tìm kiếm full-text</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm *</label>
                <textarea {...register("description")} rows={5} className="input" placeholder="Nhập mô tả chi tiết..." />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>

            {/* Biến thể */}
            <div className="card p-6">
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h2 className="font-bold text-gray-800 text-lg">Biến thể (Size/Color) *</h2>
                <button type="button" onClick={() => appendVariant({ sku: "", size: "", color: "", price: 0, stock: 10 })} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus size={16} /> Thêm biến thể
                </button>
              </div>

              <div className="space-y-4">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap sm:flex-nowrap items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">SKU *</label>
                      <input {...register(`variants.${index}.sku`)} className="input py-1.5 text-sm" placeholder="SKU-01" />
                      {errors.variants?.[index]?.sku && <p className="text-red-500 text-[10px] mt-0.5">{errors.variants[index]?.sku?.message}</p>}
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                      <input {...register(`variants.${index}.size`)} className="input py-1.5 text-sm" placeholder="M" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Màu</label>
                      <input {...register(`variants.${index}.color`)} className="input py-1.5 text-sm" placeholder="Đỏ" />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Giá *</label>
                      <input type="number" {...register(`variants.${index}.price`)} className="input py-1.5 text-sm" />
                      {errors.variants?.[index]?.price && <p className="text-red-500 text-[10px] mt-0.5">{errors.variants[index]?.price?.message}</p>}
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Số lượng *</label>
                      <input type="number" {...register(`variants.${index}.stock`)} className="input py-1.5 text-sm" />
                      {errors.variants?.[index]?.stock && <p className="text-red-500 text-[10px] mt-0.5">{errors.variants[index]?.stock?.message}</p>}
                    </div>
                    <div className="pt-6">
                      <button type="button" onClick={() => removeVariant(index)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg" disabled={variantFields.length === 1}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {errors.variants && !Array.isArray(errors.variants) && <p className="text-red-500 text-xs">{errors.variants.message}</p>}
              </div>
            </div>
          </div>

          {/* Cột phải: Hình ảnh & Tuỳ chọn khác */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">Hình ảnh *</h2>
              <div className="space-y-3">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input {...register(`images.${index}.url`)} className="input text-sm" placeholder="https://..." />
                        {errors.images?.[index]?.url && <p className="text-red-500 text-xs mt-1">{errors.images[index]?.url?.message}</p>}
                      </div>
                      <label className="cursor-pointer p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition-colors relative">
                        {uploadingIdx === index ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} />
                      </label>
                      <button type="button" onClick={() => removeImage(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100"
                        disabled={imageFields.length === 1}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {watch(`images.${index}.url`) && (
                      <img src={watch(`images.${index}.url`)} alt="" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => appendImage({ url: "" })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <ImageIcon size={16} /> Thêm ảnh khác
                </button>
                {errors.images && !Array.isArray(errors.images) && <p className="text-red-500 text-xs">{errors.images.message}</p>}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">Tuỳ chọn</h2>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" {...register("is_featured")} className="w-5 h-5 accent-blue-600" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Sản phẩm nổi bật</p>
                  <p className="text-xs text-gray-500">Hiển thị ở trang chủ</p>
                </div>
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-lg shadow-blue-500/20 shadow-lg">
              {isLoading ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
