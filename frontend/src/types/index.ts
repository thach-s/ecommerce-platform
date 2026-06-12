// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  avatar_url?: string;
  address?: Address;
  created_at: string;
}

export interface Address {
  street: string;
  district: string;
  city: string;
  zip?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  price: number;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category: string;
  brand?: string;
  images: string[];
  tags: string[];
  base_price: number;
  variants: ProductVariant[];
  is_active: boolean;
  is_featured: boolean;
  sold_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface Review {
  _id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product_id: string;
  product_name: string;
  image: string;
  sku: string;
  variant_info: { size?: string; color?: string };
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "qr_vietqr" | "qr_momo" | "qr_zalopay" | "cod";

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  qr_code_url?: string;
  qr_data_url?: string;
  transaction_id?: string;
  paid_at?: string;
}

export interface Order {
  _id: string;
  order_code: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  payment: PaymentInfo;
  order_status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  variant_info: Record<string, string>;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  street: string;
  district: string;
  city: string;
}

// ─── QR Payment ──────────────────────────────────────────────────────────────
export interface QRPaymentResponse {
  order_code: string;
  total_amount: number;
  payment_method: PaymentMethod;
  qr_code_url?: string;
  qr_data_url?: string;
  account_no?: string;
  account_name?: string;
  bank_id?: string;
  transfer_content?: string;
  pay_url?: string;
  expires_in: number;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────
export type WSEvent =
  | { event: "connected"; order_status: string; payment_status: string }
  | { event: "payment_success"; order_code: string; order_status: string; message: string; data: Partial<Order> }
  | { event: "payment_failed"; order_code: string; message: string };
