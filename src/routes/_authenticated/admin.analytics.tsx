import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getPlatformAnalytics } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const fn = useServerFn(getPlatformAnalytics);
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["platform-analytics", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Platform analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-restaurant performance for the last {days} days.</p>
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Revenue" value={`${t.revenue.toFixed(0)}`} />
        <Stat label="Orders" value={String(t.orders)} />
        <Stat label="Customers" value={String(t.customers)} />
        <Stat label="Active branches" value={`${t.activeBranches} / ${t.branches}`} />
        <Stat label="Restaurants" value={String(t.restaurants)} />
        <Stat label="Pending restaurants" value={String(t.pendingRestaurants)} />
        <Stat label="Active restaurants" value={String(t.activeRestaurants)} />
        <Stat label="Pending branches" value={String(t.pendingBranches)} />
      </div>

      <section>
        <h2 className="font-display text-2xl mb-3">Daily revenue</h2>
        <div className="rounded-xl border border-border p-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-display text-2xl mb-3">Top restaurants</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Revenue</th></tr></thead>
              <tbody>
                {data.topRestaurants.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">{r.orders}</td>
                    <td className="px-4 py-3">{r.revenue.toFixed(0)}</td>
                  </tr>
                ))}
                {data.topRestaurants.length === 0 && (<tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No data.</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl mb-3">Top products</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Revenue</th></tr></thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.qty}</td>
                    <td className="px-4 py-3">{p.revenue.toFixed(0)}</td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (<tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No data.</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
