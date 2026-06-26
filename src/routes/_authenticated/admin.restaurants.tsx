import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Check, Pause, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { TagsInput } from "@/components/TagsInput";
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

  const { data, isLoading } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => list() });

  const saveMut = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (input: any) => save({ data: input }),
    onSuccess: () => {
      toast.success("Restaurant created");
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      setOpen(false);
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
          <p className="text-sm text-muted-foreground mt-1">Create a restaurant, then open it to add branches, categories and menu items.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" />New restaurant</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New restaurant</DialogTitle></DialogHeader>
            <NewRestaurantForm onSubmit={(v) => saveMut.mutate(v)} submitting={saveMut.isPending} />
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
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {r.logo_url && <img src={r.logo_url} alt="" className="size-7 rounded-md object-cover border border-border" />}
                      {r.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(((r as any).tags ?? []) as string[]).slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Link to="/admin/restaurants/$id" params={{ id: r.id }}>
                      <Button size="sm" variant="default"><Settings2 className="size-3.5 mr-1" />Manage</Button>
                    </Link>
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
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No restaurants yet.</td></tr>
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

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NewRestaurantForm({ onSubmit, submitting }: { onSubmit: (v: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    cover_url: "",
    contact_email: "",
    contact_phone: "",
    currency: "SAR",
    status: "active" as const,
    tags: [] as string[],
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="grid md:grid-cols-[1fr_240px] gap-5">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <Label>Categories / tags</Label>
          <TagsInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
        </div>
        <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        <p className="text-xs text-muted-foreground">After creating, you can add branches, categories, and menu items.</p>
      </div>
      <div className="space-y-3">
        <ImageUpload label="Logo" folder="logos" aspect="square" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
        <ImageUpload label="Cover" folder="covers" aspect="wide" value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} />
      </div>
      <DialogFooter className="md:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create restaurant"}</Button></DialogFooter>
    </form>
  );
}
