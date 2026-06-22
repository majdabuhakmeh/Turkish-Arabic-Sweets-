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
  logo_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal("")),
  contact_phone: z.string().optional().nullable(),
  currency: z.string().default("SAR"),
  status: z.enum(["pending", "active", "inactive"]).default("pending"),
  owner_id: z.string().uuid().optional().nullable(),
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
    const map = new Map<string, unknown>();
    (managed ?? []).forEach((b) => map.set(b.id, b));
    (staff ?? []).forEach((s) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = s.branch;
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
