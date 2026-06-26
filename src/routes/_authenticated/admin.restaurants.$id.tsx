import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { TagsInput } from "@/components/TagsInput";
import {
  getRestaurantDetail,
  upsertRestaurant,
  upsertBranch,
  deleteBranch,
  upsertFood,
  deleteFood,
  upsertCategory,
  deleteCategory,
} from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/admin/restaurants/$id")({
  component: ManageRestaurant,
});

function ManageRestaurant() {
  const { id } = Route.useParams();
  const get = useServerFn(getRestaurantDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-detail", id],
    queryFn: () => get({ data: { id } }),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/restaurants" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft className="size-3.5" /> Back to restaurants
      </Link>
      <div className="flex items-center gap-4 mb-6">
        {data.restaurant.logo_url && (
          <img src={data.restaurant.logo_url} alt="" className="size-16 rounded-xl object-cover border border-border" />
        )}
        <div>
          <h1 className="font-display text-3xl">{data.restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">/{data.restaurant.slug} · {data.restaurant.status}</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="branches">Branches ({data.branches.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({data.categories.length})</TabsTrigger>
          <TabsTrigger value="menu">Menu ({data.foods.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="pt-6">
          <InfoTab restaurant={data.restaurant} />
        </TabsContent>
        <TabsContent value="branches" className="pt-6">
          <BranchesTab restaurantId={id} branches={data.branches} />
        </TabsContent>
        <TabsContent value="categories" className="pt-6">
          <CategoriesTab restaurantId={id} categories={data.categories} />
        </TabsContent>
        <TabsContent value="menu" className="pt-6">
          <MenuTab restaurantId={id} foods={data.foods} categories={data.categories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- INFO ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InfoTab({ restaurant }: { restaurant: any }) {
  const save = useServerFn(upsertRestaurant);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    id: restaurant.id as string,
    name: restaurant.name ?? "",
    slug: restaurant.slug ?? "",
    description: restaurant.description ?? "",
    logo_url: restaurant.logo_url ?? "",
    cover_url: restaurant.cover_url ?? "",
    contact_email: restaurant.contact_email ?? "",
    contact_phone: restaurant.contact_phone ?? "",
    currency: restaurant.currency ?? "SAR",
    status: restaurant.status ?? "pending",
    tags: (restaurant.tags ?? []) as string[],
  });

  const mut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["restaurant-detail", restaurant.id] });
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="grid md:grid-cols-[1fr_320px] gap-6 max-w-5xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <Label>Categories / tags</Label>
          <TagsInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
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
        <div className="pt-2"><Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save changes"}</Button></div>
      </div>
      <div className="space-y-4">
        <ImageUpload label="Logo" folder="logos" aspect="square" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
        <ImageUpload label="Cover image" folder="covers" aspect="wide" value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} />
      </div>
    </form>
  );
}

/* ---------------- BRANCHES ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BranchesTab({ restaurantId, branches }: { restaurantId: string; branches: any[] }) {
  const save = useServerFn(upsertBranch);
  const del = useServerFn(deleteBranch);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["restaurant-detail", restaurantId] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveMut = useMutation({ mutationFn: (v: any) => save({ data: v }), onSuccess: () => { toast.success("Saved"); invalidate(); setOpen(false); setEditing(null); }, onError: (e: Error) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Add branch</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit branch" : "New branch"}</DialogTitle></DialogHeader>
            <BranchForm restaurantId={restaurantId} initial={editing} submitting={saveMut.isPending} onSubmit={(v) => saveMut.mutate(v)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {branches.map((b) => (
          <div key={b.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{b.name} <span className="text-xs text-muted-foreground">({b.code})</span></div>
                <div className="text-sm text-muted-foreground">{[b.city, b.country].filter(Boolean).join(", ") || "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">{Number(b.delivery_radius_km)} km · {b.eta_minutes} min · {b.status}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete branch?")) delMut.mutate(b.id); }}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
        {branches.length === 0 && <div className="text-sm text-muted-foreground col-span-2 text-center py-8">No branches yet — add the first one above.</div>}
      </div>
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
    status: initial?.status ?? "active",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, latitude: form.latitude === "" ? null : Number(form.latitude), longitude: form.longitude === "" ? null : Number(form.longitude) }); }} className="space-y-3">
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

/* ---------------- CATEGORIES ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CategoriesTab({ restaurantId, categories }: { restaurantId: string; categories: any[] }) {
  const save = useServerFn(upsertCategory);
  const del = useServerFn(deleteCategory);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["restaurant-detail", restaurantId] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveMut = useMutation({ mutationFn: (v: any) => save({ data: v }), onSuccess: () => { toast.success("Saved"); invalidate(); setOpen(false); setEditing(null); }, onError: (e: Error) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Add category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
            <CategoryForm restaurantId={restaurantId} initial={editing} submitting={saveMut.isPending} onSubmit={(v) => saveMut.mutate(v)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4 flex items-center gap-3">
            {c.image_url && <img src={c.image_url} alt="" className="size-12 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete category?")) delMut.mutate(c.id); }}><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
        {categories.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-8">No categories yet.</div>}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CategoryForm({ restaurantId, initial, onSubmit, submitting }: { restaurantId: string; initial: any | null; onSubmit: (v: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    id: initial?.id,
    restaurant_id: restaurantId,
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    image_url: initial?.image_url ?? "",
    sort_order: initial?.sort_order ?? 0,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      </div>
      <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
      <ImageUpload label="Image" folder="categories" aspect="square" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
      <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}

/* ---------------- MENU / FOODS ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MenuTab({ restaurantId, foods, categories }: { restaurantId: string; foods: any[]; categories: any[] }) {
  const save = useServerFn(upsertFood);
  const del = useServerFn(deleteFood);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["restaurant-detail", restaurantId] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveMut = useMutation({ mutationFn: (v: any) => save({ data: v }), onSuccess: () => { toast.success("Saved"); invalidate(); setOpen(false); setEditing(null); }, onError: (e: Error) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-2" />Add food</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? "Edit food" : "New food"}</DialogTitle></DialogHeader>
            <FoodForm restaurantId={restaurantId} categories={categories} initial={editing} submitting={saveMut.isPending} onSubmit={(v) => saveMut.mutate(v)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {foods.map((f) => (
          <div key={f.id} className="rounded-xl border border-border overflow-hidden">
            {f.image_url ? (
              <img src={f.image_url} alt="" className="w-full aspect-[4/3] object-cover" />
            ) : (
              <div className="w-full aspect-[4/3] bg-muted grid place-items-center text-xs text-muted-foreground">No image</div>
            )}
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-sm font-medium">{Number(f.price)} {/* currency from restaurant */}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.category_slug ?? "uncategorised"}{f.is_available ? "" : " · sold out"}{f.is_featured ? " · featured" : ""}</div>
              <div className="flex gap-1 mt-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete food?")) delMut.mutate(f.id); }}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
        {foods.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-8">No foods yet.</div>}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FoodForm({ restaurantId, categories, initial, onSubmit, submitting }: { restaurantId: string; categories: any[]; initial: any | null; onSubmit: (v: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    id: initial?.id,
    restaurant_id: restaurantId,
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    image_url: initial?.image_url ?? "",
    category_slug: initial?.category_slug ?? "",
    is_available: initial?.is_available ?? true,
    is_featured: initial?.is_featured ?? false,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <ImageUpload label="Photo" folder="foods" aspect="wide" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      </div>
      <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></div>
        <div>
          <Label>Category</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Available</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
      </div>
      <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button></DialogFooter>
    </form>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
