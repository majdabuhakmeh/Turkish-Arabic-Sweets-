import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { Loader2 } from "lucide-react";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  delivery_address: string;
};

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Your orders — Saffron Kitchen" }] }),
  component: OrdersPage,
});

const statusLabels: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  on_the_way: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,status,total,created_at,delivery_address")
        .order("created_at", { ascending: false });
      if (active) setOrders((data as Order[]) ?? []);
    };
    load();

    const channel = supabase
      .channel("orders-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!orders) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-6xl">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center rounded-full bg-primary text-primary-foreground px-6 h-12 font-medium"
          >
            Browse menu
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                className="block rounded-2xl border border-border bg-card p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Order #{o.id.slice(0, 8)}
                    </div>
                    <div className="mt-1 font-display text-2xl">
                      ${Number(o.total).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "delivered"
      ? "bg-success/15 text-success"
      : status === "cancelled"
        ? "bg-destructive/15 text-destructive"
        : "bg-primary/15 text-primary";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}