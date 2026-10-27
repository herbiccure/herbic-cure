'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: string; // product id
  name: string;
  slug: string;
  price: number;
  regularPrice?: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: { code: string; discountValue: number; discountType: string } | null;
  applyCoupon: (coupon: { code: string; discountValue: number; discountType: string }) => void;
  removeCoupon: () => void;
  discountAmount: number;
  finalTotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  codAdvance?: {
    enabled: boolean;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    maxCap?: number | null;
    message: string;
  } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountValue: number;
    discountType: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(499);
  const [standardShippingFee, setStandardShippingFee] = useState(89);
  const [codAdvance, setCodAdvance] = useState<{
    enabled: boolean;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    maxCap?: number | null;
    message: string;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('herbic_cart') || localStorage.getItem('herbicas_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
      const savedCoupon = localStorage.getItem('herbic_coupon') || localStorage.getItem('herbicas_coupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch {
      // Graceful fallback for restricted storage (private browsing)
    }

    // Fetch dynamic store shipping settings from admin
    fetch('/api/navigation')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.freeShippingThreshold === 'number') {
          setFreeShippingThreshold(data.freeShippingThreshold);
        }
        if (typeof data?.standardShippingFee === 'number') {
          setStandardShippingFee(data.standardShippingFee);
        }
        if (data?.codAdvance) {
          setCodAdvance(data.codAdvance);
        } else {
          setCodAdvance(null);
        }
      })
      .catch(() => {});
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('herbic_cart', JSON.stringify(items));
      } catch {
        // Storage quota exceeded or private browsing
      }
    }
  }, [items, isMounted]);

  useEffect(() => {
    if (isMounted) {
      try {
        if (appliedCoupon) {
          localStorage.setItem('herbic_coupon', JSON.stringify(appliedCoupon));
        } else {
          localStorage.removeItem('herbic_coupon');
        }
      } catch {
        // Storage quota exceeded or private browsing
      }
    }
  }, [appliedCoupon, isMounted]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...newItem, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  // In the cart preview stage, all orders default to 0 shipping charges (Prepaid Free Delivery).
  // Standard courier fee (standardShippingFee) is only applied at checkout if the customer selects COD.
  const shippingFee = 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const applyCoupon = (coupon: { code: string; discountValue: number; discountType: string }) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        finalTotal,
        shippingFee,
        freeShippingThreshold,
        standardShippingFee,
        codAdvance,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
