import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Public: list all active restaurants (vendors). */
export const listActiveRestaurants = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("id,name,slug,description,logo_url,cover_url,currency,contact_phone,contact_email")
      .eq("status", "active")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

/** Public: list active branches, optionally filtered by restaurant. */
export const listActiveBranches = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ restaurantId: z.string().uuid().optional(), slug: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    let restaurantId = data.restaurantId;
    if (!restaurantId && data.slug) {
      const { data: r } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("slug", data.slug)
        .maybeSingle();
      restaurantId = r?.id;
    }
    let q = supabaseAdmin
      .from("branches")
      .select(
        "id,restaurant_id,name,code,address,city,country,latitude,longitude,phone,delivery_radius_km,delivery_fee,min_order,eta_minutes,status",
      )
      .eq("status", "active");
    if (restaurantId) q = q.eq("restaurant_id", restaurantId);
    const { data: branches, error } = await q.order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return branches ?? [];
  });

/** Haversine in km */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Public: rank branches by proximity to a customer location. */
export const findNearestBranches = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        lat: z.number(),
        lng: z.number(),
        restaurantId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("branches")
      .select(
        "id,restaurant_id,name,code,address,city,latitude,longitude,delivery_radius_km,delivery_fee,eta_minutes,status",
      )
      .eq("status", "active");
    if (data.restaurantId) q = q.eq("restaurant_id", data.restaurantId);
    const { data: branches, error } = await q;
    if (error) throw new Error(error.message);
    const ranked = (branches ?? [])
      .filter((b) => b.latitude != null && b.longitude != null)
      .map((b) => {
        const distance = distanceKm(data.lat, data.lng, b.latitude!, b.longitude!);
        return {
          ...b,
          distance_km: Math.round(distance * 10) / 10,
          in_range: distance <= Number(b.delivery_radius_km ?? 0),
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km);
    return ranked;
  });

/** Public: get branch + inventory snapshot for a branch (only available foods). */
export const getBranchMenu = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branchId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: branch }, { data: inv }] = await Promise.all([
      supabaseAdmin
        .from("branches")
        .select("*, restaurant:restaurants(id,name,slug,currency)")
        .eq("id", data.branchId)
        .maybeSingle(),
      supabaseAdmin
        .from("branch_inventory")
        .select("food_id,available,price_override,stock, food:foods(*)")
        .eq("branch_id", data.branchId)
        .eq("available", true),
    ]);
    if (!branch) throw new Error("Branch not found");
    return { branch, items: inv ?? [] };
  });
