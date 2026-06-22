import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { DollarSign, ShoppingBag, Receipt, XCircle, Loader2 } from "lucide-react";
import { getAdminReports } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const statusColor: Record<string, string> = {
  placed: "#64748b",
  preparing: "#f59e0b",
  on_the_way: "#0ea5e9",
  delivered: "#10b981",
  cancelled: "#f43f5e",
};

function AdminReports() {
  const fn = useServerFn(getAdminReports);
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", days],
    queryFn: () => fn({ data: { days } }),
  });

  const cards = data
    ? [
        { label: "Revenue", value: `$${data.revenue.toFixed(2)}`, icon: DollarSign },
        { label: "Orders", value: data.totalOrders, icon: ShoppingBag },
        { label: "Avg order", value: `$${data.avgOrder.toFixed(2)}`, icon: Receipt },
        { label: "Cancelled", value: data.cancelled, icon: XCircle },
      ]
    : [];

  const statusData = data
    ? Object.entries(data.byStatus).map(([name, value]) => ({ name, value }))
    : [];
  const paymentData = data
    ? Object.entries(data.byPayment).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Reports</h1>
          <p className="text-muted-foreground">Sales performance and best sellers.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-md px-3 h-8 text-sm transition-colors ${
                days === r.days ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="min-h-[40vh] grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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

          <div className="rounded-xl border border-border p-6 bg-card">
            <h2 className="font-display text-2xl mb-4">Revenue over time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.daily} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  minTickGap={24}
                />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" width={48} />
                <Tooltip
                  formatter={(v: number) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border p-6 bg-card">
              <h2 className="font-display text-2xl mb-4">Orders per day</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.daily} margin={{ left: -10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    minTickGap={24}
                  />
                  <YAxis fontSize={12} stroke="var(--muted-foreground)" width={36} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border p-6 bg-card">
              <h2 className="font-display text-2xl mb-4">Orders by status</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" fontSize={12} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={12}
                    width={84}
                    stroke="var(--muted-foreground)"
                    tickFormatter={(s: string) => s.replace(/_/g, " ")}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={statusColor[s.name] ?? "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border p-6 bg-card">
              <h2 className="font-display text-2xl mb-4">Top sellers</h2>
              {data.topDishes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sales in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.topDishes.map((d, i) => (
                    <li key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="flex items-center gap-4 shrink-0">
                        <span className="text-muted-foreground">{d.qty} sold</span>
                        <span className="font-medium tabular-nums">${d.revenue.toFixed(2)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border p-6 bg-card">
              <h2 className="font-display text-2xl mb-4">Payment methods</h2>
              {paymentData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentData.map((p) => (
                    <li key={p.name} className="flex justify-between text-sm capitalize">
                      <span>{p.name.replace(/_/g, " ")}</span>
                      <span className="font-medium">{p.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}