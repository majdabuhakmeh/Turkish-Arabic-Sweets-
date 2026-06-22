import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMyBranches, getBranchOrders } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/branch/reports")({
  component: BranchReports,
});

function BranchReports() {
  const listB = useServerFn(getMyBranches);
  const listO = useServerFn(getBranchOrders);
  const [branchId, setBranchId] = useState("");

  const { data: branches } = useQuery({ queryKey: ["my-branches"], queryFn: () => listB() });
  const activeId = branchId || (branches as { id: string }[] | undefined)?.[0]?.id || "";

  const { data: orders } = useQuery({
    queryKey: ["branch-orders", activeId],
    queryFn: () => listO({ data: { branchId: activeId } }),
    enabled: !!activeId,
  });

  const total = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
  const delivered = (orders ?? []).filter((o) => o.status === "delivered").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Branch reports</h1>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={activeId} onChange={(e) => setBranchId(e.target.value)}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(branches ?? []).map((b: any) => (<option key={b.id} value={b.id}>{b.name}</option>))}
        </select>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Orders (last 200)" value={String(orders?.length ?? 0)} />
        <Stat label="Revenue" value={`${total.toFixed(0)} SAR`} />
        <Stat label="Delivered" value={String(delivered)} />
      </div>
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
