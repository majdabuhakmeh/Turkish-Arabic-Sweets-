import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { getMyBranches, getBranchInventory, updateBranchInventory } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/branch/inventory")({
  component: BranchInventory,
});

function BranchInventory() {
  const listB = useServerFn(getMyBranches);
  const listI = useServerFn(getBranchInventory);
  const update = useServerFn(updateBranchInventory);
  const qc = useQueryClient();
  const [branchId, setBranchId] = useState("");

  const { data: branches } = useQuery({ queryKey: ["my-branches"], queryFn: () => listB() });
  const activeId = branchId || (branches as { id: string }[] | undefined)?.[0]?.id || "";

  const { data: inv, isLoading } = useQuery({
    queryKey: ["branch-inv", activeId],
    queryFn: () => listI({ data: { branchId: activeId } }),
    enabled: !!activeId,
  });

  const mut = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (v: any) => update({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branch-inv"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Inventory</h1>
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
            <thead className="bg-muted/40 text-left"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Available</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Price override</th></tr></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(inv ?? []).map((row: any) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">{row.food?.name ?? row.food_id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={row.available}
                      onCheckedChange={(v) => mut.mutate({ branchId: activeId, foodId: row.food_id, available: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      defaultValue={row.stock ?? ""}
                      className="w-24"
                      onBlur={(e) => mut.mutate({ branchId: activeId, foodId: row.food_id, stock: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={row.price_override ?? ""}
                      placeholder={row.food?.price ?? ""}
                      className="w-28"
                      onBlur={(e) => mut.mutate({ branchId: activeId, foodId: row.food_id, price_override: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </td>
                </tr>
              ))}
              {(inv ?? []).length === 0 && (<tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No products.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
