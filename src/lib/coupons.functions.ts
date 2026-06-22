import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

/* ---------- Customer: validate a code at checkout ---------- */

export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        code: z.string().trim().min(1).max(60),
        subtotal: z.number().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("validate_coupon", {
      _code: data.code,
      _subtotal: data.subtotal,
    });
    if (error) throw new Error(error.message);
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r) return { valid: false, code: data.code.toUpperCase(), discount: 0, message: "Invalid promo code" };
    return {
      valid: r.valid,
      code: r.code,
      discount: Number(r.discount),
      message: r.message,
    };
  });

/* ---------- Customer: preview a code's rules + impact before applying ---------- */

export type CouponPreview = {
  found: boolean;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  min_subtotal: number | null;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number | null;
  active: boolean | null;
  eligible: boolean;
  discount: number;
  message: string;
};

export const previewCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        code: z.string().trim().min(1).max(60),
        subtotal: z.number().nonnegative(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<CouponPreview> => {
    const { data: rows, error } = await context.supabase.rpc("preview_coupon", {
      _code: data.code,
      _subtotal: data.subtotal,
    });
    if (error) throw new Error(error.message);
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r || !r.found) {
      return {
        found: false,
        code: data.code.toUpperCase(),
        description: null,
        discount_type: null,
        discount_value: null,
        min_subtotal: null,
        max_discount: null,
        starts_at: null,
        expires_at: null,
        usage_limit: null,
        used_count: null,
        active: null,
        eligible: false,
        discount: 0,
        message: r?.message ?? "No promo code matches that.",
      };
    }
    return {
      found: true,
      code: r.code,
      description: r.description,
      discount_type: r.discount_type as "percent" | "fixed" | null,
      discount_value: r.discount_value === null ? null : Number(r.discount_value),
      min_subtotal: r.min_subtotal === null ? null : Number(r.min_subtotal),
      max_discount: r.max_discount === null ? null : Number(r.max_discount),
      starts_at: r.starts_at,
      expires_at: r.expires_at,
      usage_limit: r.usage_limit,
      used_count: r.used_count,
      active: r.active,
      eligible: r.eligible,
      discount: Number(r.discount),
      message: r.message,
    };
  });

/* ---------- Admin CRUD ---------- */

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Coupon[];
  });

const couponInput = z.object({
  code: z.string().trim().min(2).max(40),
  description: z.string().trim().max(200).optional().nullable(),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().positive(),
  min_subtotal: z.number().nonnegative().default(0),
  max_discount: z.number().positive().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const upsertCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid().optional() }).merge(couponInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      code: data.code,
      description: data.description ?? null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_subtotal: data.min_subtotal,
      max_discount: data.max_discount ?? null,
      usage_limit: data.usage_limit ?? null,
      starts_at: data.starts_at || null,
      expires_at: data.expires_at || null,
      active: data.active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabaseAdmin.from("coupons").insert(payload);
    if (error) throw new Error(/duplicate/i.test(error.message) ? "A coupon with that code already exists" : error.message);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });