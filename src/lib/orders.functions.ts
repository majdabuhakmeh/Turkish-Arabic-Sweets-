import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  food_id: z.string().min(1),
  qty: z.number().int().positive(),
});

const placeOrderSchema = z.object({
  items: z.array(itemSchema).min(1),
  delivery: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().min(3).max(40),
    address: z.string().min(1).max(300),
    city: z.string().min(1).max(100),
    notes: z.string().max(500).optional(),
  }),
  payment_method: z.enum(["card", "cash"]),
  coupon_code: z.string().trim().min(1).max(60).optional(),
});

// Server-authoritative pricing constants. Never trust client-supplied fees.
const DELIVERY_FEE = 3.5;
const TAX_RATE = 0.08;

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Look up canonical prices from the DB — never trust client-supplied prices.
    const ids = [...new Set(data.items.map((i) => i.food_id))];
    const { data: foods, error: foodsErr } = await supabase
      .from("foods")
      .select("id, name, image_url, price, is_available")
      .in("id", ids);
    if (foodsErr) throw new Error(foodsErr.message);

    const foodById = new Map((foods ?? []).map((f) => [f.id, f]));
    const lineItems = data.items.map((i) => {
      const f = foodById.get(i.food_id);
      if (!f) throw new Error("One or more items are no longer available");
      if (!f.is_available) throw new Error(`${f.name} is no longer available`);
      return {
        food_id: f.id,
        name: f.name,
        image_url: f.image_url ?? null,
        unit_price: Number(f.price),
        qty: i.qty,
      };
    });

    const subtotal = +lineItems.reduce((a, i) => a + i.unit_price * i.qty, 0).toFixed(2);

    // Atomically validate + redeem the coupon server-side (service role only).
    // Closes the price-tampering and usage-limit race vectors at once.
    let discount = 0;
    let appliedCode: string | null = null;
    if (data.coupon_code) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows, error: cErr } = await supabaseAdmin.rpc("validate_and_redeem_coupon", {
        _code: data.coupon_code,
        _subtotal: subtotal,
      });
      if (cErr) throw new Error(cErr.message);
      const r = Array.isArray(rows) ? rows[0] : rows;
      if (!r || !r.valid) throw new Error(r?.message || "Invalid promo code");
      discount = Number(r.discount);
      appliedCode = r.code;
    }

    const discounted = Math.max(0, subtotal - discount);
    const tax = +(discounted * TAX_RATE).toFixed(2);
    const total = +(discounted + DELIVERY_FEE + tax).toFixed(2);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "placed",
        subtotal,
        discount,
        coupon_code: appliedCode,
        delivery_fee: DELIVERY_FEE,
        tax,
        total,
        payment_method: data.payment_method,
        delivery_name: data.delivery.name,
        delivery_phone: data.delivery.phone,
        delivery_address: data.delivery.address,
        delivery_city: data.delivery.city,
        delivery_notes: data.delivery.notes ?? null,
      })
      .select()
      .single();
    if (error || !order) throw new Error(error?.message || "Failed to create order");

    const itemsPayload = lineItems.map((i) => ({
      order_id: order.id,
      food_id: i.food_id,
      name: i.name,
      image_url: i.image_url ?? null,
      unit_price: i.unit_price,
      qty: i.qty,
      line_total: +(i.unit_price * i.qty).toFixed(2),
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) throw new Error(itemsErr.message);

    return { id: order.id };
  });