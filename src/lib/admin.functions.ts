import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

/** Bootstrap: promote current user to admin only if no admin exists yet. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (existing) throw new Error("An admin already exists. Ask an existing admin to grant access.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Dashboard ---------- */

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [orders, foods, categories, customers] = await Promise.all([
      supabaseAdmin.from("orders").select("id,total,status,created_at"),
      supabaseAdmin.from("foods").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    const o = orders.data ?? [];
    const revenue = o.reduce((a, x) => a + Number(x.total), 0);
    const byStatus: Record<string, number> = {};
    for (const x of o) byStatus[x.status] = (byStatus[x.status] ?? 0) + 1;
    return {
      totalOrders: o.length,
      revenue,
      foods: foods.count ?? 0,
      categories: categories.count ?? 0,
      customers: customers.count ?? 0,
      byStatus,
      recent: o
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 5),
    };
  });

/* ---------- Orders ---------- */

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id,created_at,status,total,delivery_name,delivery_city,payment_method")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["placed", "preparing", "on_the_way", "delivered", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Reports ---------- */

export const getAdminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const since = new Date();
    since.setDate(since.getDate() - (data.days - 1));
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [ordersRes, itemsRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id,total,status,payment_method,created_at")
        .gte("created_at", sinceIso),
      supabaseAdmin
        .from("order_items")
        .select("name,qty,line_total,order_id,orders!inner(created_at)")
        .gte("orders.created_at", sinceIso),
    ]);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (itemsRes.error) throw new Error(itemsRes.error.message);

    const orders = ordersRes.data ?? [];
    const items = (itemsRes.data ?? []) as { name: string; qty: number; line_total: number }[];

    const paying = orders.filter((o) => o.status !== "cancelled");
    const revenue = paying.reduce((a, o) => a + Number(o.total), 0);
    const totalOrders = orders.length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const avgOrder = paying.length ? revenue / paying.length : 0;

    // Daily series
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < data.days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    for (const o of orders) {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      const row = dayMap.get(key);
      if (!row) continue;
      row.orders += 1;
      if (o.status !== "cancelled") row.revenue += Number(o.total);
    }
    const daily = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders,
    }));

    // Status + payment breakdowns
    const byStatus: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      byPayment[o.payment_method] = (byPayment[o.payment_method] ?? 0) + 1;
    }

    // Top dishes by quantity
    const dishMap = new Map<string, { qty: number; revenue: number }>();
    for (const it of items) {
      const row = dishMap.get(it.name) ?? { qty: 0, revenue: 0 };
      row.qty += Number(it.qty);
      row.revenue += Number(it.line_total);
      dishMap.set(it.name, row);
    }
    const topDishes = Array.from(dishMap.entries())
      .map(([name, v]) => ({ name, qty: v.qty, revenue: Math.round(v.revenue * 100) / 100 }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    return {
      revenue: Math.round(revenue * 100) / 100,
      totalOrders,
      cancelled,
      avgOrder: Math.round(avgOrder * 100) / 100,
      daily,
      byStatus,
      byPayment,
      topDishes,
    };
  });

/* ---------- Categories ---------- */

const categorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and dashes only"),
  image_url: z.string().url().or(z.literal("")).optional(),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid().optional() }).merge(categorySchema).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const payload = {
      name: data.name,
      slug: data.slug,
      image_url: data.image_url || null,
      sort_order: data.sort_order,
    };
    const q = data.id
      ? supabaseAdmin.from("categories").update(payload).eq("id", data.id)
      : supabaseAdmin.from("categories").insert(payload);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Foods ---------- */

const foodSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and dashes only"),
  description: z.string().max(1000).default(""),
  price: z.number().nonnegative().max(100000),
  image_url: z.string().url().or(z.literal("")).optional(),
  category_slug: z.string().min(1).max(80),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

export const listFoods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("foods")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid().optional() }).merge(foodSchema).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      image_url: data.image_url || null,
      category_slug: data.category_slug,
      is_available: data.is_available,
      is_featured: data.is_featured,
    };
    let q;
    if (data.id) {
      q = supabaseAdmin.from("foods").update(payload).eq("id", data.id);
    } else {
      const { data: r } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("slug", "royal-sweets")
        .maybeSingle();
      if (!r) throw new Error("Default restaurant not found");
      q = supabaseAdmin.from("foods").insert({ ...payload, restaurant_id: r.id });
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("foods").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Users & roles ---------- */

export const ADMIN_PERMISSIONS = [
  "manage_orders",
  "manage_menu",
  "manage_categories",
  "view_reports",
  "manage_users",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const [profilesRes, rolesRes, ordersRes, permsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,full_name,phone,avatar_url,created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.from("orders").select("user_id,total,status"),
      supabaseAdmin.from("user_permissions").select("user_id,permission"),
    ]);
    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (permsRes.error) throw new Error(permsRes.error.message);

    // Email lookup from auth (paginated)
    const emailById = new Map<string, string>();
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      for (const u of data.users) if (u.email) emailById.set(u.id, u.email);
      if (data.users.length < 200) break;
    }

    const roleSet = new Map<string, Set<string>>();
    for (const r of rolesRes.data ?? []) {
      const set = roleSet.get(r.user_id) ?? new Set<string>();
      set.add(r.role);
      roleSet.set(r.user_id, set);
    }

    const permSet = new Map<string, Set<string>>();
    for (const p of permsRes.data ?? []) {
      const set = permSet.get(p.user_id) ?? new Set<string>();
      set.add(p.permission);
      permSet.set(p.user_id, set);
    }

    const orderStats = new Map<string, { orders: number; spent: number }>();
    for (const o of ordersRes.data ?? []) {
      if (!o.user_id) continue;
      const s = orderStats.get(o.user_id) ?? { orders: 0, spent: 0 };
      s.orders += 1;
      if (o.status !== "cancelled") s.spent += Number(o.total);
      orderStats.set(o.user_id, s);
    }

    return (profilesRes.data ?? []).map((p) => {
      const stats = orderStats.get(p.id) ?? { orders: 0, spent: 0 };
      const isAdmin = roleSet.get(p.id)?.has("admin") ?? false;
      const granted = permSet.get(p.id) ?? new Set<string>();
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        email: emailById.get(p.id) ?? null,
        isAdmin,
        permissions: ADMIN_PERMISSIONS.filter((perm) => isAdmin || granted.has(perm)),
        orders: stats.orders,
        spent: Math.round(stats.spent * 100) / 100,
      };
    });
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.userId === context.userId && !data.makeAdmin) {
      throw new Error("You cannot revoke your own admin role.");
    }

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setUserPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        permission: z.enum(ADMIN_PERMISSIONS),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .upsert(
          { user_id: data.userId, permission: data.permission },
          { onConflict: "user_id,permission" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.userId)
        .eq("permission", data.permission);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- Admin: branch status + platform analytics ---------- */

export const setBranchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "active", "inactive"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("branches")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPlatformAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    const [
      { data: restaurants },
      { data: branches },
      { data: orders },
      { data: items },
      { count: totalCustomers },
    ] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id, name, status"),
      supabaseAdmin.from("branches").select("id, name, restaurant_id, status"),
      supabaseAdmin
        .from("orders")
        .select("id, total, restaurant_id, status, created_at")
        .gte("created_at", since),
      supabaseAdmin
        .from("order_items")
        .select("name, qty, line_total, orders!inner(created_at)")
        .gte("orders.created_at", since),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const restList = restaurants ?? [];
    const branchList = branches ?? [];
    const o = orders ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const it = (items ?? []) as any[];

    const nameById = new Map(restList.map((r) => [r.id, r.name]));
    const byRest = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const r of restList) byRest.set(r.id, { name: r.name, orders: 0, revenue: 0 });
    for (const x of o) {
      if (!x.restaurant_id) continue;
      const cur = byRest.get(x.restaurant_id) ?? { name: nameById.get(x.restaurant_id) ?? "—", orders: 0, revenue: 0 };
      cur.orders += 1;
      if (x.status !== "cancelled") cur.revenue += Number(x.total);
      byRest.set(x.restaurant_id, cur);
    }

    const topRestaurants = Array.from(byRest.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top products platform-wide
    const dish = new Map<string, { qty: number; revenue: number }>();
    for (const x of it) {
      const cur = dish.get(x.name) ?? { qty: 0, revenue: 0 };
      cur.qty += Number(x.qty);
      cur.revenue += Number(x.line_total);
      dish.set(x.name, cur);
    }
    const topProducts = Array.from(dish.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Daily revenue
    const days: string[] = [];
    for (let i = data.days - 1; i >= 0; i--) days.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
    const dayIdx = new Map(days.map((d, i) => [d, i]));
    const dailyRevenue = days.map((day) => ({ day, revenue: 0 }));
    for (const x of o) {
      if (x.status === "cancelled") continue;
      const key = String(x.created_at).slice(0, 10);
      const idx = dayIdx.get(key);
      if (idx == null) continue;
      dailyRevenue[idx].revenue += Number(x.total);
    }

    return {
      windowDays: data.days,
      totals: {
        restaurants: restList.length,
        activeRestaurants: restList.filter((r) => r.status === "active").length,
        pendingRestaurants: restList.filter((r) => r.status === "pending").length,
        branches: branchList.length,
        activeBranches: branchList.filter((b) => b.status === "active").length,
        pendingBranches: branchList.filter((b) => b.status === "pending").length,
        customers: totalCustomers ?? 0,
        orders: o.length,
        revenue: o.filter((x) => x.status !== "cancelled").reduce((s, x) => s + Number(x.total), 0),
      },
      topRestaurants,
      topProducts,
      dailyRevenue,
    };
  });
