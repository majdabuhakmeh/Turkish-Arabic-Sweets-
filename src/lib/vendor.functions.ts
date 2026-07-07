import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function assertCanManageRestaurant(userId: string, restaurantId: string) {
  if (await isAdmin(userId)) return;
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurantId)
    .maybeSingle();
  if (data?.owner_id !== userId) throw new Error("Forbidden");
}

async function assertCanManageBranch(userId: string, branchId: string) {
  if (await isAdmin(userId)) return;
  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("manager_id, restaurant:restaurants(owner_id)")
    .eq("id", branchId)
    .maybeSingle();
  if (!branch) throw new Error("Branch not found");
  if (branch.manager_id === userId) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (branch.restaurant as any)?.owner_id;
  if (ownerId === userId) return;
  const { data: staff } = await supabaseAdmin
    .from("branch_staff")
    .select("id")
    .eq("branch_id", branchId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!staff) throw new Error("Forbidden");
}

/* ----- restaurants ----- */

export const getMyRestaurants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context.userId);
    const q = supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });
    const { data, error } = admin ? await q : await q.eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const restaurantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  description: z.string().optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
  cover_url: z.string().url().optional().nullable().or(z.literal("")),
  contact_email: z.string().email().optional().nullable().or(z.literal("")),
  contact_phone: z.string().optional().nullable(),
  currency: z.string().default("SAR"),
  status: z.enum(["pending", "active", "inactive"]).default("pending"),
  owner_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().min(1)).optional().default([]),
});

export const upsertRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => restaurantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const admin = await isAdmin(context.userId);
    const payload = { ...data, contact_email: data.contact_email || null };
    if (data.id) {
      await assertCanManageRestaurant(context.userId, data.id);
      // non-admin can't change status or owner
      if (!admin) {
        delete (payload as Record<string, unknown>).status;
        delete (payload as Record<string, unknown>).owner_id;
      }
      const { error } = await supabaseAdmin.from("restaurants").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    // Create
    const insert = { ...payload };
    if (!admin) {
      insert.owner_id = context.userId;
      insert.status = "pending";
    } else if (!insert.owner_id) {
      insert.owner_id = context.userId;
    }
    const { data: created, error } = await supabaseAdmin
      .from("restaurants")
      .insert(insert)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: created.id };
  });

export const setRestaurantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["pending", "active", "inactive"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- branches ----- */

export const getBranchesForRestaurant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: branches, error } = await supabaseAdmin
      .from("branches")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return branches ?? [];
  });

const branchSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1).max(32),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  delivery_radius_km: z.coerce.number().min(0).default(10),
  delivery_fee: z.coerce.number().min(0).default(0),
  min_order: z.coerce.number().min(0).default(0),
  eta_minutes: z.coerce.number().int().min(0).default(45),
  status: z.enum(["pending", "active", "inactive"]).default("pending"),
  manager_id: z.string().uuid().optional().nullable(),
});

export const upsertBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => branchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurant_id);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabaseAdmin.from("branches").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("branches")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // Seed branch_inventory with all foods of the restaurant
    const { data: foods } = await supabaseAdmin
      .from("foods")
      .select("id")
      .eq("restaurant_id", data.restaurant_id);
    if (foods?.length) {
      await supabaseAdmin
        .from("branch_inventory")
        .upsert(
          foods.map((f) => ({ branch_id: created.id, food_id: f.id, available: true })),
          { onConflict: "branch_id,food_id" },
        );
    }
    return { ok: true, id: created.id };
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: b } = await supabaseAdmin
      .from("branches")
      .select("restaurant_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!b) throw new Error("Branch not found");
    await assertCanManageRestaurant(context.userId, b.restaurant_id);
    const { error } = await supabaseAdmin.from("branches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- branch manager: my branches + inventory ----- */

export const getMyBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (await isAdmin(context.userId)) {
      const { data } = await supabaseAdmin
        .from("branches")
        .select("*, restaurant:restaurants(name,slug)")
        .order("name");
      return data ?? [];
    }
    const [{ data: managed }, { data: staff }] = await Promise.all([
      supabaseAdmin
        .from("branches")
        .select("*, restaurant:restaurants(name,slug)")
        .eq("manager_id", context.userId),
      supabaseAdmin
        .from("branch_staff")
        .select("branch:branches(*, restaurant:restaurants(name,slug))")
        .eq("user_id", context.userId),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (managed ?? []).forEach((b: any) => map.set(b.id, b));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (staff ?? []).forEach((s: any) => {
      const b = s.branch;
      if (b?.id) map.set(b.id, b);
    });
    return Array.from(map.values());
  });

export const getBranchInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ branchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { data: inv, error } = await supabaseAdmin
      .from("branch_inventory")
      .select("*, food:foods(id,name,slug,price,image_url)")
      .eq("branch_id", data.branchId);
    if (error) throw new Error(error.message);
    return inv ?? [];
  });

export const updateBranchInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        branchId: z.string().uuid(),
        foodId: z.string().uuid(),
        available: z.boolean().optional(),
        stock: z.coerce.number().int().nullable().optional(),
        price_override: z.coerce.number().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { error } = await supabaseAdmin
      .from("branch_inventory")
      .upsert(
        {
          branch_id: data.branchId,
          food_id: data.foodId,
          available: data.available ?? true,
          stock: data.stock ?? null,
          price_override: data.price_override ?? null,
        },
        { onConflict: "branch_id,food_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getBranchOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ branchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("branch_id", data.branchId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return orders ?? [];
  });

/* ----- analytics ----- */

export const getRestaurantAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const [{ data: orders }, { data: branches }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id,total,status,branch_id,created_at")
        .eq("restaurant_id", data.restaurantId),
      supabaseAdmin
        .from("branches")
        .select("id,name")
        .eq("restaurant_id", data.restaurantId),
    ]);
    const o = orders ?? [];
    const byBranch = new Map<string, { branchId: string; name: string; revenue: number; count: number }>();
    (branches ?? []).forEach((b) => byBranch.set(b.id, { branchId: b.id, name: b.name, revenue: 0, count: 0 }));
    let totalRevenue = 0;
    for (const x of o) {
      totalRevenue += Number(x.total);
      const k = x.branch_id ?? "—";
      if (!byBranch.has(k)) byBranch.set(k, { branchId: k, name: "Unassigned", revenue: 0, count: 0 });
      const row = byBranch.get(k)!;
      row.revenue += Number(x.total);
      row.count += 1;
    }
    return {
      totalRevenue,
      orderCount: o.length,
      branches: Array.from(byBranch.values()).sort((a, b) => b.revenue - a.revenue),
    };
  });

/* ----- assets (image uploads to private bucket, returned as long signed URLs) ----- */

const ASSET_BUCKET = "restaurant-assets";
const SIGN_TTL = 60 * 60 * 24 * 365 * 10; // ~10 years

export const uploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        folder: z.enum(["logos", "covers", "foods", "categories", "branches"]),
        filename: z.string().min(1),
        contentType: z.string().min(1),
        // base64 of file bytes (no data: prefix)
        base64: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.folder}/${context.userId}/${Date.now()}-${safe}`;
    const bytes = Buffer.from(data.base64, "base64");
    const { error } = await supabaseAdmin.storage
      .from(ASSET_BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(ASSET_BUCKET)
      .createSignedUrl(path, SIGN_TTL);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl, path };
  });

/* ----- restaurant detail (with branches, foods, categories) ----- */

export const getRestaurantDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.id);
    const [{ data: restaurant }, { data: branches }, { data: foods }, { data: categories }] =
      await Promise.all([
        supabaseAdmin.from("restaurants").select("*").eq("id", data.id).single(),
        supabaseAdmin.from("branches").select("*").eq("restaurant_id", data.id).order("name"),
        supabaseAdmin.from("foods").select("*").eq("restaurant_id", data.id).order("created_at", { ascending: false }),
        supabaseAdmin.from("categories").select("*").eq("restaurant_id", data.id).order("sort_order"),
      ]);
    if (!restaurant) throw new Error("Restaurant not found");
    return { restaurant, branches: branches ?? [], foods: foods ?? [], categories: categories ?? [] };
  });

/* ----- categories CRUD ----- */

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase, numbers, dashes"),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  sort_order: z.coerce.number().int().default(0),
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => categorySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurant_id);
    const payload = { ...data, image_url: data.image_url || null };
    if (data.id) {
      const { id, ...rest } = payload;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabaseAdmin.from("categories").update(rest as any).eq("id", id as string);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: c, error } = await supabaseAdmin.from("categories").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: c.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await supabaseAdmin.from("categories").select("restaurant_id").eq("id", data.id).maybeSingle();
    if (!row?.restaurant_id) throw new Error("Category not found");
    await assertCanManageRestaurant(context.userId, row.restaurant_id);
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- foods CRUD ----- */

const foodSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase, numbers, dashes"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  category_slug: z.string().optional().nullable(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export const upsertFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => foodSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurant_id);
    const payload = { ...data, image_url: data.image_url || null, category_slug: data.category_slug || null };
    if (data.id) {
      const { id, ...rest } = payload;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabaseAdmin.from("foods").update(rest as any).eq("id", id as string);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: f, error } = await supabaseAdmin.from("foods").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    // Seed branch_inventory for all branches of this restaurant
    const { data: brs } = await supabaseAdmin.from("branches").select("id").eq("restaurant_id", data.restaurant_id);
    if (brs?.length) {
      await supabaseAdmin.from("branch_inventory").upsert(
        brs.map((b) => ({ branch_id: b.id, food_id: f.id, available: true })),
        { onConflict: "branch_id,food_id" },
      );
    }
    return { ok: true, id: f.id };
  });

export const deleteFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await supabaseAdmin.from("foods").select("restaurant_id").eq("id", data.id).maybeSingle();
    if (!row?.restaurant_id) throw new Error("Food not found");
    await assertCanManageRestaurant(context.userId, row.restaurant_id);
    const { error } = await supabaseAdmin.from("foods").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- vendor scoped list helpers ----- */

export const listVendorFoods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: rows, error } = await supabaseAdmin
      .from("foods")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listVendorCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: rows, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/* ----- vendor coupons (scoped by restaurant_id on coupons table) ----- */

export const listVendorCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: rows, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const vendorCouponSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  code: z.string().trim().min(2).max(40),
  description: z.string().trim().max(200).optional().nullable(),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.coerce.number().positive(),
  min_subtotal: z.coerce.number().nonnegative().default(0),
  max_discount: z.coerce.number().positive().optional().nullable(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const upsertVendorCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => vendorCouponSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurant_id);
    const payload = {
      restaurant_id: data.restaurant_id,
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_subtotal: data.min_subtotal,
      max_discount: data.max_discount ?? null,
      usage_limit: data.usage_limit ?? null,
      expires_at: data.expires_at || null,
      active: data.active,
    };
    if (data.id) {
      // Confirm the coupon belongs to this restaurant before updating.
      const { data: existing } = await supabaseAdmin
        .from("coupons")
        .select("restaurant_id")
        .eq("id", data.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((existing as any)?.restaurant_id && (existing as any).restaurant_id !== data.restaurant_id) {
        throw new Error("Coupon belongs to a different restaurant");
      }
      const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error } = await supabaseAdmin.from("coupons").insert(payload as any).select("id").single();
    if (error) throw new Error(/duplicate/i.test(error.message) ? "A coupon with that code already exists" : error.message);
    return { ok: true, id: created.id };
  });

export const deleteVendorCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await supabaseAdmin.from("coupons").select("restaurant_id").eq("id", data.id).maybeSingle() as any;
    if (!row?.restaurant_id) throw new Error("Coupon not found");
    await assertCanManageRestaurant(context.userId, row.restaurant_id);
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- staff management ----- */

export const searchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(100) }).parse(d))
  .handler(async ({ data }) => {
    // Search profiles by name; admin API lookup for email match too.
    const q = data.query;
    const { data: byName } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .ilike("full_name", `%${q}%`)
      .limit(20);
    const results = new Map<string, { id: string; full_name: string | null; email: string | null; avatar_url: string | null }>();
    (byName ?? []).forEach((p) => results.set(p.id, { id: p.id, full_name: p.full_name ?? null, email: null, avatar_url: p.avatar_url ?? null }));
    // Try email exact match through admin auth API.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: authRes } = await (supabaseAdmin.auth.admin as any).listUsers({ page: 1, perPage: 200 });
      const users = authRes?.users ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const u of users as any[]) {
        if (!u.email) continue;
        if (String(u.email).toLowerCase().includes(q.toLowerCase())) {
          const existing = results.get(u.id) ?? { id: u.id, full_name: null, email: null, avatar_url: null };
          existing.email = u.email;
          results.set(u.id, existing);
        }
      }
    } catch { /* ignore */ }
    return Array.from(results.values()).slice(0, 30);
  });

export const listBranchStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ branchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { data: rows, error } = await supabaseAdmin
      .from("branch_staff")
      .select("id, role, user_id, profile:profiles(id, full_name, avatar_url)")
      .eq("branch_id", data.branchId);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const assignBranchStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        branchId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["manager", "staff"]).default("staff"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { error } = await supabaseAdmin
      .from("branch_staff")
      .upsert(
        { branch_id: data.branchId, user_id: data.userId, role: data.role },
        { onConflict: "branch_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeBranchStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await supabaseAdmin.from("branch_staff").select("branch_id").eq("id", data.id).maybeSingle();
    if (!row?.branch_id) throw new Error("Not found");
    await assertCanManageBranch(context.userId, row.branch_id);
    const { error } = await supabaseAdmin.from("branch_staff").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBranchManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ branchId: z.string().uuid(), userId: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageBranch(context.userId, data.branchId);
    const { error } = await supabaseAdmin
      .from("branches")
      .update({ manager_id: data.userId })
      .eq("id", data.branchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----- extended analytics ----- */

export const getBranchRevenueSeries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ restaurantId: z.string().uuid(), days: z.coerce.number().int().min(1).max(365).default(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const [{ data: orders }, { data: branches }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("total, branch_id, created_at")
        .eq("restaurant_id", data.restaurantId)
        .gte("created_at", since),
      supabaseAdmin.from("branches").select("id, name").eq("restaurant_id", data.restaurantId),
    ]);
    const branchList = branches ?? [];
    // Build day buckets
    const days: string[] = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000);
      days.push(d.toISOString().slice(0, 10));
    }
    const series = days.map((day) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = { day };
      for (const b of branchList) row[b.name] = 0;
      return row;
    });
    const indexByDay = new Map(days.map((d, i) => [d, i]));
    const nameById = new Map(branchList.map((b) => [b.id, b.name]));
    for (const o of orders ?? []) {
      const day = String(o.created_at).slice(0, 10);
      const idx = indexByDay.get(day);
      if (idx == null) continue;
      const name = nameById.get(o.branch_id ?? "");
      if (!name) continue;
      series[idx][name] = Number(series[idx][name] ?? 0) + Number(o.total);
    }
    return { series, branches: branchList.map((b) => b.name) };
  });

export const getBestSellersPerBranch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, branch_id")
      .eq("restaurant_id", data.restaurantId);
    const orderIds = (orders ?? []).map((o) => o.id);
    const branchByOrder = new Map((orders ?? []).map((o) => [o.id, o.branch_id]));
    if (!orderIds.length) return [];
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("order_id, name, qty, line_total")
      .in("order_id", orderIds);
    const { data: branches } = await supabaseAdmin
      .from("branches")
      .select("id, name")
      .eq("restaurant_id", data.restaurantId);
    const branchName = new Map((branches ?? []).map((b) => [b.id, b.name]));
    // Group by branch → name → qty/revenue
    const byBranch = new Map<string, Map<string, { qty: number; revenue: number }>>();
    for (const it of items ?? []) {
      const bid = branchByOrder.get(it.order_id) ?? "";
      if (!bid) continue;
      const inner = byBranch.get(bid) ?? new Map();
      const cur = inner.get(it.name) ?? { qty: 0, revenue: 0 };
      cur.qty += Number(it.qty);
      cur.revenue += Number(it.line_total);
      inner.set(it.name, cur);
      byBranch.set(bid, inner);
    }
    const result: { branchId: string; branchName: string; items: { name: string; qty: number; revenue: number }[] }[] = [];
    for (const [bid, inner] of byBranch) {
      const items = Array.from(inner.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
      result.push({ branchId: bid, branchName: branchName.get(bid) ?? "—", items });
    }
    return result.sort((a, b) => a.branchName.localeCompare(b.branchName));
  });

export const getDeliveryPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, branch_id, status")
      .eq("restaurant_id", data.restaurantId)
      .in("status", ["delivered", "out_for_delivery"]);
    const orderIds = (orders ?? []).map((o) => o.id);
    if (!orderIds.length) return [];
    const { data: events } = await supabaseAdmin
      .from("order_status_events")
      .select("order_id, status, created_at")
      .in("order_id", orderIds);
    const branchByOrder = new Map((orders ?? []).map((o) => [o.id, o.branch_id]));
    const { data: branches } = await supabaseAdmin
      .from("branches")
      .select("id, name")
      .eq("restaurant_id", data.restaurantId);
    const nameById = new Map((branches ?? []).map((b) => [b.id, b.name]));
    // Build timeline per order
    const timeline = new Map<string, Record<string, number>>();
    for (const e of events ?? []) {
      const t = new Date(e.created_at).getTime();
      const cur = timeline.get(e.order_id) ?? {};
      cur[e.status] = t;
      timeline.set(e.order_id, cur);
    }
    const agg = new Map<string, { branchId: string; branchName: string; prep: number[]; delivery: number[] }>();
    for (const [orderId, ts] of timeline) {
      const bid = branchByOrder.get(orderId) ?? "";
      if (!bid) continue;
      const row = agg.get(bid) ?? { branchId: bid, branchName: nameById.get(bid) ?? "—", prep: [], delivery: [] };
      const placed = ts["placed"] ?? ts["pending"] ?? ts["confirmed"];
      const preparing = ts["preparing"];
      const delivered = ts["delivered"];
      if (placed && preparing) row.prep.push((preparing - placed) / 60000);
      if (preparing && delivered) row.delivery.push((delivered - preparing) / 60000);
      agg.set(bid, row);
    }
    const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
    return Array.from(agg.values())
      .map((r) => ({
        branchId: r.branchId,
        branchName: r.branchName,
        avgPrepMinutes: Math.round(avg(r.prep)),
        avgDeliveryMinutes: Math.round(avg(r.delivery)),
        sampleSize: r.delivery.length,
      }))
      .sort((a, b) => a.branchName.localeCompare(b.branchName));
  });

export const getRetention = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ restaurantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.restaurantId);
    const since = new Date(Date.now() - 90 * 86400_000).toISOString();
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("user_id")
      .eq("restaurant_id", data.restaurantId)
      .gte("created_at", since);
    const counts = new Map<string, number>();
    for (const o of orders ?? []) {
      if (!o.user_id) continue;
      counts.set(o.user_id, (counts.get(o.user_id) ?? 0) + 1);
    }
    const unique = counts.size;
    const repeat = Array.from(counts.values()).filter((n) => n >= 2).length;
    return {
      windowDays: 90,
      uniqueCustomers: unique,
      repeatCustomers: repeat,
      retentionRate: unique ? Math.round((repeat / unique) * 100) : 0,
    };
  });

/* ----- restaurant profile update (owner-scoped, currency + branding) ----- */

const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal("")),
  contact_phone: z.string().optional().nullable(),
  currency: z.string().min(3).max(3).default("SAR"),
});

export const updateRestaurantProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => profileSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageRestaurant(context.userId, data.id);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      contact_email: rest.contact_email || null,
      currency: rest.currency.toUpperCase(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.from("restaurants").update(payload as any).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
