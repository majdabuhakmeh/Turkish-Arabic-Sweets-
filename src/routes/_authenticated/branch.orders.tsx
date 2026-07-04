import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMyBranches, getBranchOrders } from "@/lib/vendor.functions";
import { updateOrderStatus } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/branch/orders")({
  component: BranchOrders,
});

// Best-effort browser notification sound for incoming orders.
function playChime() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.06;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.stop(ctx.currentTime + 0.42);
  } catch { /* no-op */ }
}

function BranchOrders() {
  const listB = useServerFn(getMyBranches);
  const listO = useServerFn(getBranchOrders);
  const update = useServerFn(updateOrderStatus);
  const qc = useQueryClient();
  const [branchId, setBranchId] = useState("");

  const { data: branches } = useQuery({ queryKey: ["my-branches"], queryFn: () => listB() });
  const activeId = branchId || (branches as { id: string }[] | undefined)?.[0]?.id || "";

  const { data: orders, isLoading } = useQuery({
    queryKey: ["branch-orders", activeId],
    queryFn: () => listO({ data: { branchId: activeId } }),
    enabled: !!activeId,
  });

  const mut = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (v: any) => update({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["branch-orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Branch orders</h1>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={activeId} onChange={(e) => setBranchId(e.target.value)}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(branches ?? []).map((b: any) => (<option key={b.id} value={b.id}>{b.name}</option>))}
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{Number(o.total).toFixed(2)} SAR</td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={o.status}
                      onChange={(e) => mut.mutate({ id: o.id, status: e.target.value })}
                    >
                      {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (<tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
