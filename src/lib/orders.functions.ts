import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  food_slug: z.string().min(1),
  qty: z.number().int().positive(),
});

const placeOrderSchema = z.object({
  branch_id: z.string().uuid(),
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

const TAX_RATE = 0.08;

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Resolve the branch (source of truth for fees + min order + restaurant).
    const { data: branch, error: branchErr } = await supabase
      .from("branches")
      .select("id, restaurant_id, delivery_fee, min_order, status, name")
      .eq("id", data.branch_id)
      .maybeSingle();
    if (branchErr) throw new Error(branchErr.message);
    if (!branch) throw new Error("Selected branch is unavailable");
    if (branch.status !== "active") throw new Error(`${branch.name} is not accepting orders right now`);

    // 2. Look up foods by slug, scoped to this branch's restaurant.
    const slugs = [...new Set(data.items.map((i) => i.food_slug))];
    const { data: foods, error: foodsErr } = await supabase
      .from("foods")
      .select("id, slug, name, image_url, price, is_available")
      .eq("restaurant_id", branch.restaurant_id)
      .in("slug", slugs);
    if (foodsErr) throw new Error(foodsErr.message);
    const foodBySlug = new Map((foods ?? []).map((f) => [f.slug, f]));

    // 3. Overlay branch inventory (availability + price override + stock).
    const foodIds = (foods ?? []).map((f) => f.id);
    const { data: inv, error: invErr } = await supabase
      .from("branch_inventory")
      .select("food_id, available, price_override, stock")
      .eq("branch_id", branch.id)
      .in("food_id", foodIds);
    if (invErr) throw new Error(invErr.message);
    const invByFoodId = new Map((inv ?? []).map((r) => [r.food_id, r]));

    // 4. Build authoritative line items.
    const lineItems = data.items.map((i) => {
      const f = foodBySlug.get(i.food_slug);
      if (!f) throw new Error("One or more items are no longer available");
      if (!f.is_available) throw new Error(`${f.name} is no longer available`);
      const e = invByFoodId.get(f.id);
      if (!e || !e.available) throw new Error(`${f.name} is not available at ${branch.name}`);
      if (e.stock != null && e.stock < i.qty) {
        throw new Error(`Only ${e.stock} of ${f.name} left at ${branch.name}`);
      }
      const unit_price = e.price_override != null ? Number(e.price_override) : Number(f.price);
      return {
        food_id: f.id,
        name: f.name,
        image_url: f.image_url ?? null,
        unit_price,
        qty: i.qty,
      };
    });

    const subtotal = +lineItems.reduce((a, i) => a + i.unit_price * i.qty, 0).toFixed(2);

    // 5. Enforce branch minimum order (pre-discount).
    const minOrder = Number(branch.min_order ?? 0);
    if (minOrder > 0 && subtotal < minOrder) {
      throw new Error(
        `${branch.name} has a minimum order of ${minOrder.toFixed(2)}. Add ${(minOrder - subtotal).toFixed(2)} more to continue.`,
      );
    }

    // 6. Atomically validate + redeem the coupon server-side.
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

    const deliveryFee = Number(branch.delivery_fee ?? 0);
    const discounted = Math.max(0, subtotal - discount);
    const tax = +(discounted * TAX_RATE).toFixed(2);
    const total = +(discounted + deliveryFee + tax).toFixed(2);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        restaurant_id: branch.restaurant_id,
        branch_id: branch.id,
        status: "placed",
        subtotal,
        discount,
        coupon_code: appliedCode,
        delivery_fee: deliveryFee,
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
