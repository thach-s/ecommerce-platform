"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const existing = get().items.find((i) => i.sku === newItem.sku);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.sku === newItem.sku
                ? { ...i, quantity: i.quantity + newItem.quantity, subtotal: (i.quantity + newItem.quantity) * i.unit_price }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (sku) => set({ items: get().items.filter((i) => i.sku !== sku) }),

      updateQuantity: (sku, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.sku === sku ? { ...i, quantity, subtotal: quantity * i.unit_price } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
    }),
    { name: "cart-storage" }
  )
);
