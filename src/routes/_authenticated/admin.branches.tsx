import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getMyRestaurants, getBranchesForRestaurant, upsertBranch, deleteBranch } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/admin/branches")({
  component: AdminBranches,
});

function AdminBranches() {
  const listR = useServerFn(getMyRestaurants);
  const listB = useServerFn(getBranchesForRestaurant);
  const save = useServerFn(upsertBranch);
  const del = useServerFn(deleteBranch);
  const qc = useQueryClient();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);

  const { data: restaurants } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => listR() });
  const activeId = restaurantId || restaurants?.[0]?.id || "";

  const { data: branches, isLoading } = useQuery({
    queryKey: ["admin-branches", activeId],
    queryFn: () => listB({ data: { restaurantId: activeId } }),
    enabled: !!activeId,
  });

  const saveMut = useMutation({
    mutationFn: (input: Parameters<typeof save>[0]["data"]) => save({ data: input }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-branches"] }); setOpen(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-branches"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Branches</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage branches per restaurant.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={activeId}
            onChange={(e) => setRestaurantId(e.target.value)}
          >
            {(restaurants ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button disabled={!activeId}><Plus className="size-4 mr-2" />New branch</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing ? "Edit branch" : "New branch"}</DialogTitle></DialogHeader>
              <BranchForm
                restaurantId={activeId}
                initial={editing}
                onSubmit={(v) => saveMut.mutate(v)}
                submitting={saveMut.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Radius</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(branches ?? []).map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.code}</td>
                  <td className="px-4 py-3">{b.city ?? "—"}</td>
                  <td className="px-4 py-3">{Number(b.delivery_radius_km)} km</td>
                  <td className="px-4 py-3">{b.eta_minutes} min</td>
                  <td className="px-4 py-3">{b.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete branch?")) delMut.mutate(b.id); }}>Delete</Button>
                  </td>
                </tr>
              ))}
              {(branches ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No branches yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BranchForm({ restaurantId, initial, onSubmit, submitting }: { restaurantId: string; initial: any | null; onSubmit: (v: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    id: initial?.id,
    restaurant_id: initial?.restaurant_id ?? restaurantId,
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "SA",
    latitude: initial?.latitude ?? "",
    longitude: initial?.longitude ?? "",
    phone: initial?.phone ?? "",
    delivery_radius_km: initial?.delivery_radius_km ?? 10,
    delivery_fee: initial?.delivery_fee ?? 0,
    min_order: initial?.min_order ?? 0,
    eta_minutes: initial?.eta_minutes ?? 45,
    status: initial?.status ?? "pending",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
      </div>
      <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
        <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Radius (km)</Label><Input type="number" value={form.delivery_radius_km} onChange={(e) => setForm({ ...form, delivery_radius_km: Number(e.target.value) })} /></div>
        <div><Label>Delivery fee</Label><Input type="number" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })} /></div>
        <div><Label>Min order</Label><Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} /></div>
        <div><Label>ETA (min)</Label><Input type="number" value={form.eta_minutes} onChange={(e) => setForm({ ...form, eta_minutes: Number(e.target.value) })} /></div>
      </div>
      <div>
        <Label>Status</Label>
        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save branch"}</Button></DialogFooter>
    </form>
  );
}
