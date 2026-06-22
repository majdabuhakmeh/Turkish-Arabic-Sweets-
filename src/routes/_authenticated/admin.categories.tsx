import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteCategory, listCategories, upsertCategory } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Cat = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
};

function AdminCategories() {
  const listFn = useServerFn(listCategories);
  const upsertFn = useServerFn(upsertCategory);
  const deleteFn = useServerFn(deleteCategory);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["admin-cats"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Cat | null>(null);
  const [open, setOpen] = useState(false);

  type UpsertInput = {
    id?: string;
    name: string;
    slug: string;
    image_url?: string;
    sort_order: number;
  };
  const upsert = useMutation({
    mutationFn: (v: UpsertInput) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(c: Cat) {
    setEditing(c);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    upsert.mutate({
      id: editing?.id,
      name: String(f.get("name")),
      slug: String(f.get("slug")),
      image_url: String(f.get("image_url") || ""),
      sort_order: Number(f.get("sort_order") || 0),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Categories</h1>
          <p className="text-muted-foreground">Group your menu items.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4" /> New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input name="name" required defaultValue={editing?.name} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input name="slug" required defaultValue={editing?.slug} placeholder="pizza" />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input name="image_url" defaultValue={editing?.image_url ?? ""} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} />
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
              <th className="p-3">Slug</th>
              <th className="p-3 hidden sm:table-cell">Order</th>
              <th className="p-3 w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3 hidden sm:table-cell">{c.sort_order}</td>
                <td className="p-3 flex gap-2 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => confirm(`Delete ${c.name}?`) && del.mutate(c.id)}
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