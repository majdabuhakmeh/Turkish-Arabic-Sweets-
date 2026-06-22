import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRestaurants, getRestaurantAnalytics } from "@/lib/vendor.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/vendor/analytics")({
  component: VendorAnalytics,
});

function VendorAnalytics() {
  const listR = useServerFn(getMyRestaurants);
  const analytics = useServerFn(getRestaurantAnalytics);
  const { data: restaurants } = useQuery({ queryKey: ["my-restaurants"], queryFn: () => listR() });
  const [restaurantId, setRestaurantId] = useState<string>("");
  const activeId = restaurantId || restaurants?.[0]?.id || "";

  const { data: a } = useQuery({
    queryKey: ["restaurant-analytics", activeId],
    queryFn: () => analytics({ data: { restaurantId: activeId } }),
    enabled: !!activeId,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Branch comparison</h1>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={activeId} onChange={(e) => setRestaurantId(e.target.value)}>
          {(restaurants ?? []).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
      </div>
      {a ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Avg order</th></tr></thead>
            <tbody>
              {a.branches.map((b) => (
                <tr key={b.branchId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.count}</td>
                  <td className="px-4 py-3">{b.revenue.toFixed(0)} SAR</td>
                  <td className="px-4 py-3">{b.count ? (b.revenue / b.count).toFixed(0) : "0"} SAR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick a restaurant to view comparison.</p>
      )}
    </div>
  );
}
