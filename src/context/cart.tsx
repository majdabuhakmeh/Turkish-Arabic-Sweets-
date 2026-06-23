import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { foods, type Food } from "@/lib/foods";
import { useBranch } from "@/context/branch";

export type CartItem = { id: string; qty: number };

type CartLine = {
  food: Food;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
};

type CartCtx = {
  items: CartItem[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  hasUnavailable: boolean;
  detailed: CartLine[];
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "royalsweets-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartCtx>(() => {
    const detailed = items
      .map((i) => {
        const food = foods.find((f) => f.id === i.id);
        if (!food) return null;
        return { food, qty: i.qty, lineTotal: food.price * i.qty };
      })
      .filter(Boolean) as { food: Food; qty: number; lineTotal: number }[];

    return {
      items,
      detailed,
      count: items.reduce((a, b) => a + b.qty, 0),
      subtotal: detailed.reduce((a, b) => a + b.lineTotal, 0),
      add: (id, qty = 1) =>
        setItems((prev) => {
          const e = prev.find((p) => p.id === id);
          if (e) return prev.map((p) => (p.id === id ? { ...p, qty: p.qty + qty } : p));
          return [...prev, { id, qty }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
