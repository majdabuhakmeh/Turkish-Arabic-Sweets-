import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Check, Pause, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getMyRestaurants, upsertRestaurant, setRestaurantStatus } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/admin/restaurants")({
  component: AdminRestaurants,
});

function AdminRestaurants() {
  const list = useServerFn(getMyRestaurants);
  const save = useServerFn(upsertRestaurant);
  const setStatus = useServerFn(setRestaurantStatus);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => list() });

  const saveMut = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (input: any) => save({ data: input }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "pending" | "inactive" }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Restaurants</h1>
          <p className="text-sm text-muted-foreground mt-1">Approve vendors and manage the directory.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" />New restaurant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit restaurant" : "New restaurant"}</DialogTitle></DialogHeader>
            <RestaurantForm
              initial={editing}
              onSubmit={(v) => saveMut.mutate(v)}
              submitting={saveMut.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button>
                    {r.status !== "active" && (
                      <Button size="sm" variant="ghost" onClick={() => statusMut.mutate({ id: r.id, status: "active" })}>
                        <Check className="size-3.5 mr-1" />Approve
                      </Button>
                    )}
                    {r.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => statusMut.mutate({ id: r.id, status: "inactive" })}>
                        <Pause className="size-3.5 mr-1" />Pause
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No restaurants yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${map[status] ?? ""}`}>{status}</span>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RestaurantForm({ initial, onSubmit, submitting }: { initial: any | null; onSubmit: (v: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    logo_url: initial?.logo_url ?? "",
    cover_url: initial?.cover_url ?? "",
    contact_email: initial?.contact_email ?? "",
    contact_phone: initial?.contact_phone ?? "",
    currency: initial?.currency ?? "SAR",
    status: initial?.status ?? "pending",
  });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      </div>
      <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
        <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        <div>
          <Label>Status</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}
