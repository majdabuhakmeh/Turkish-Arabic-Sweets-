import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listCoupons,
  upsertCoupon,
  deleteCoupon,
  toggleCoupon,
  type Coupon,
} from "@/lib/coupons.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

type Form = {
  id?: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_subtotal: string;
  max_discount: string;
  usage_limit: string;
  expires_at: string;
  active: boolean;
};

const empty: Form = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  min_subtotal: "0",
  max_discount: "",
  usage_limit: "",
  expires_at: "",
  active: true,
};

function toForm(c: Coupon): Form {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? "",
    discount_type: c.discount_type,
    discount_value: String(c.discount_value),
    min_subtotal: String(c.min_subtotal),
    max_discount: c.max_discount != null ? String(c.max_discount) : "",
    usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
    active: c.active,
  };
}

function AdminCoupons() {
  const listFn = useServerFn(listCoupons);
  const upsertFn = useServerFn(upsertCoupon);
  const deleteFn = useServerFn(deleteCoupon);
  const toggleFn = useServerFn(toggleCoupon);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          id: form.id,
          code: form.code.trim(),
          description: form.description.trim() || null,
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          min_subtotal: Number(form.min_subtotal || 0),
          max_discount: form.max_discount ? Number(form.max_discount) : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Coupon updated" : "Coupon created");
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Coupon deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setForm(toForm(c));
    setOpen(true);
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    const value = Number(form.discount_value);
    if (!form.discount_value || Number.isNaN(value) || value <= 0) {
      toast.error("Enter a discount value greater than 0");
      return;
    }
    save.mutate();
  };

  const formatDiscount = (c: Coupon) =>
    c.discount_type === "percent" ? `${c.discount_value}% off` : `$${c.discount_value} off`;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl">Coupons</h1>
          <p className="text-muted-foreground">Create and manage promo codes & discounts.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> New coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Ticket className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No coupons yet.</p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="size-4" /> Create your first coupon
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min order</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-mono font-medium">{c.code}</div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{formatDiscount(c)}</Badge>
                    {c.discount_type === "percent" && c.max_discount != null && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        max ${c.max_discount}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.min_subtotal > 0 ? `$${c.min_subtotal}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.used_count}
                    {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={c.active}
                      onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete coupon ${c.code}?`)) del.mutate(c.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit coupon" : "New coupon"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Code</span>
              <Input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="mt-1 font-mono uppercase"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <Input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Summer sale"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Type</span>
              <select
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as "percent" | "fixed")}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Value {form.discount_type === "percent" ? "(%)" : "($)"}
              </span>
              <Input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Min order ($)
              </span>
              <Input
                type="number"
                min="0"
                value={form.min_subtotal}
                onChange={(e) => set("min_subtotal", e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Max discount ($)
              </span>
              <Input
                type="number"
                min="0"
                value={form.max_discount}
                onChange={(e) => set("max_discount", e.target.value)}
                placeholder="No cap"
                className="mt-1"
                disabled={form.discount_type === "fixed"}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Usage limit
              </span>
              <Input
                type="number"
                min="1"
                value={form.usage_limit}
                onChange={(e) => set("usage_limit", e.target.value)}
                placeholder="Unlimited"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Expires
              </span>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => set("expires_at", e.target.value)}
                className="mt-1"
              />
            </label>
            <label className="flex items-center gap-3 sm:col-span-2">
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={save.isPending}
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {form.id ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}