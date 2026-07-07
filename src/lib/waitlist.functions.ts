import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: capture an email + optional city/lat/lng for a service-area they want. */
export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email(),
        city: z.string().trim().max(100).optional().nullable(),
        lat: z.number().optional().nullable(),
        lng: z.number().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("waitlist").insert({
      email: data.email,
      city: data.city ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: list waitlist entries (most recent first). */
export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admin only");
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
