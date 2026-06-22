import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteFood,
  listCategories,
  listFoods,
  upsertFood,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/foods")({
  component: AdminFoods,
});

type Food = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  image_url: string | null;
  category_slug: string;
  is_available: boolean;
  is_featured: boolean;
};

function AdminFoods() {
  const listFn = useServerFn(listFoods);
  const catsFn = useServerFn(listCategories);
  const upsertFn = useServerFn(upsertFood);
  const deleteFn = useServerFn(deleteFood);
  const qc = useQueryClient();

  const { data: foods } = useQuery({ queryKey: ["admin-foods"], queryFn: () => listFn() });
  const { data: cats } = useQuery({ queryKey: ["admin-cats"], queryFn: () => catsFn() });

  const [editing, setEditing] = useState<Food | null>(null);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState<string>("");

  type FoodInput = {
    id?: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    image_url?: string;
    category_slug: string;
    is_available: boolean;
    is_featured: boolean;
  };

  const upsert = useMutation({
    mutationFn: (v: FoodInput) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-foods"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-foods"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setAvailable(true);
    setFeatured(false);
    setCategory(cats?.[0]?.slug ?? "");
    setOpen(true);
  }
  function openEdit(f: Food) {
    setEditing(f);
    setAvailable(f.is_available);
    setFeatured(f.is_featured);
    setCategory(f.category_slug);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    upsert.mutate({
      id: editing?.id,
      name: String(fd.get("name")),
      slug: String(fd.get("slug")),
      description: String(fd.get("description") || ""),
      price: Number(fd.get("price")),
      image_url: String(fd.get("image_url") || ""),
      category_slug: category,
      is_available: available,
      is_featured: featured,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Foods</h1>
          <p className="text-muted-foreground">Manage menu items.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit food" : "New food"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input name="name" required defaultValue={editing?.name} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input name="slug" required defaultValue={editing?.slug} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" rows={3} defaultValue={editing?.description} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price</Label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editing ? Number(editing.price) : ""}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {cats?.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input name="image_url" defaultValue={editing?.image_url ?? ""} />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={available} onCheckedChange={setAvailable} /> Available
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={featured} onCheckedChange={setFeatured} /> Featured
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={upsert.isPending}>Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3 hidden sm:table-cell">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3 hidden md:table-cell">Status</th>
              <th className="p-3 w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {foods?.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{f.slug}</div>
                </td>
                <td className="p-3 hidden sm:table-cell capitalize">{f.category_slug}</td>
                <td className="p-3 font-medium">${Number(f.price).toFixed(2)}</td>
                <td className="p-3 hidden md:table-cell">
                  <div className="flex gap-1">
                    {f.is_available ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                    {f.is_featured && <Badge>Featured</Badge>}
                  </div>
                </td>
                <td className="p-3 flex gap-2 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(f as Food)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => confirm(`Delete ${f.name}?`) && del.mutate(f.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}