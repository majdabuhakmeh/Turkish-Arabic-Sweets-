import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { ShoppingBag, DollarSign, UtensilsCrossed, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;

  const cards = [
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingBag },
    { label: "Revenue", value: `$${data.revenue.toFixed(2)}`, icon: DollarSign },
    { label: "Foods", value: data.foods, icon: UtensilsCrossed },
    { label: "Customers", value: data.customers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border p-5 bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="font-display text-3xl">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border p-6 bg-card">
          <h2 className="font-display text-2xl mb-4">Orders by status</h2>
          <ul className="space-y-2">
            {["placed", "preparing", "on_the_way", "delivered", "cancelled"].map((s) => (
              <li key={s} className="flex justify-between text-sm capitalize">
                <span>{s.replace(/_/g, " ")}</span>
                <span className="font-medium">{data.byStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {data.recent.map((o) => (
              <li key={o.id} className="flex justify-between text-sm">
                <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                <span className="capitalize text-muted-foreground">{o.status.replace(/_/g, " ")}</span>
                <span className="font-medium">{Number(o.total).toFixed(2)} NIS</span>
              </li>
            ))}
            {data.recent.length === 0 && <li className="text-muted-foreground text-sm">No orders yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}