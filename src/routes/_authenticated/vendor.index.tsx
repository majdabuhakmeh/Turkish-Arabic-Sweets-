import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRestaurants, getRestaurantAnalytics } from "@/lib/vendor.functions";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/")({
  component: VendorHome,
});

function VendorHome() {
  const listR = useServerFn(getMyRestaurants);
  const analytics = useServerFn(getRestaurantAnalytics);
  const { data: restaurants } = useQuery({ queryKey: ["my-restaurants"], queryFn: () => listR() });
  const first = restaurants?.[0];
  const { data: a } = useQuery({
    queryKey: ["restaurant-analytics", first?.id],
    queryFn: () => analytics({ data: { restaurantId: first!.id } }),
    enabled: !!first,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">My restaurants</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your vendor profile, branches and team.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(restaurants ?? []).map((r) => (
          <Link key={r.id} to="/vendor/branches" className="rounded-xl border border-border p-5 hover:border-foreground transition-colors flex items-center gap-4">
            <div className="size-12 rounded-full bg-muted grid place-items-center"><Store className="size-5 text-primary" /></div>
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.slug} · {r.status}</div>
            </div>
          </Link>
        ))}
      </div>

      {a && (
        <div>
          <h2 className="font-display text-2xl mb-3">{first?.name} · performance</h2>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <Stat label="Revenue" value={`${a.totalRevenue.toFixed(0)} SAR`} />
            <Stat label="Orders" value={String(a.orderCount)} />
            <Stat label="Branches" value={String(a.branches.length)} />
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th></tr></thead>
              <tbody>
                {a.branches.map((b) => (
                  <tr key={b.branchId} className="border-t border-border">
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3">{b.count}</td>
                    <td className="px-4 py-3">{b.revenue.toFixed(0)} SAR</td>
                  </tr>
                ))}
                {a.branches.length === 0 && (<tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-1">{value}</div>
    </div>
  );
}
