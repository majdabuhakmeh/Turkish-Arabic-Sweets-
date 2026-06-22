import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listAllOrders, updateOrderStatus } from "@/lib/admin.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wifi, WifiOff, Search, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["placed", "preparing", "on_the_way", "delivered", "cancelled"] as const;
const PAYMENTS = ["cash", "card"] as const;

const statusColor: Record<string, string> = {
  placed: "bg-slate-500",
  preparing: "bg-amber-500",
  on_the_way: "bg-sky-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

function AdminOrders() {
  const fn = useServerFn(listAllOrders);
  const updateFn = useServerFn(updateOrderStatus);
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [range, setRange] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fn(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const mut = useMutation({
    mutationFn: (v: { id: string; status: (typeof STATUSES)[number] }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rangeMs: Record<string, number> = {
    today: 1,
    "7d": 7,
    "30d": 30,
  };
  const now = Date.now();
  const q = search.trim().toLowerCase();
  const filtered = (data ?? []).filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.payment_method !== paymentFilter) return false;
    if (range !== "all") {
      const days = rangeMs[range];
      if (now - +new Date(o.created_at) > days * 86400000) return false;
    }
    if (q) {
      const hay = `${o.id} ${o.delivery_name ?? ""} ${o.delivery_city ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const hasFilters = statusFilter !== "all" || paymentFilter !== "all" || range !== "all" || q !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Orders</h1>
          <p className="text-muted-foreground">Update order status as it moves through the kitchen.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {live ? (
            <>
              <Wifi className="size-3.5 text-emerald-500" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3.5 text-muted-foreground" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, city or order #"
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENTS.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPaymentFilter("all");
              setRange("all");
            }}
            className="flex items-center gap-1 h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" /> Clear
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3 hidden md:table-cell">City</th>
              <th className="p-3 hidden sm:table-cell">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="p-3">{o.delivery_name}</td>
                <td className="p-3 hidden md:table-cell">{o.delivery_city}</td>
                <td className="p-3 hidden sm:table-cell text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-medium">${Number(o.total).toFixed(2)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block size-2 rounded-full ${statusColor[o.status] ?? "bg-muted"}`} />
                    <Select
                      value={o.status}
                      onValueChange={(v) =>
                        mut.mutate({ id: o.id, status: v as (typeof STATUSES)[number] })
                      }
                    >
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">
                {data && data.length === 0 ? "No orders yet." : "No orders match your filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && data && data.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {data.length} orders
        </p>
      )}
    </div>
  );
}
