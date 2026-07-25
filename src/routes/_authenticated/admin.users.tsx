import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import {
  ADMIN_PERMISSIONS,
  listUsers,
  setAdminRole,
  setUserPermission,
  type AdminPermission,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const PERMISSION_LABELS: Record<AdminPermission, { label: string; desc: string }> = {
  manage_orders: { label: "Orders", desc: "View and update order status" },
  manage_menu: { label: "Menu", desc: "Create and edit dishes" },
  manage_categories: { label: "Categories", desc: "Manage menu categories" },
  view_reports: { label: "Reports", desc: "View sales reports & analytics" },
  manage_users: { label: "Users", desc: "Manage users, roles & permissions" },
};

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  email: string | null;
  isAdmin: boolean;
  permissions: AdminPermission[];
  orders: number;
  spent: number;
};

function initials(name: string | null, email: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function AdminUsers() {
  const listFn = useServerFn(listUsers);
  const roleFn = useServerFn(setAdminRole);
  const permFn = useServerFn(setUserPermission);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Row[]>({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "admins" | "customers">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "matrix">("list");

  const role = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => roleFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.makeAdmin ? "Admin role granted" : "Admin role revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const perm = useMutation({
    mutationFn: (v: { userId: string; permission: AdminPermission; enabled: boolean }) =>
      permFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((u) => {
      if (filter === "admins" && !u.isAdmin) return false;
      if (filter === "customers" && u.isAdmin) return false;
      if (!term) return true;
      return [u.full_name, u.email, u.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [data, q, filter]);

  const adminCount = (data ?? []).filter((u) => u.isAdmin).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl">Users</h1>
          <p className="text-muted-foreground">
            {data ? `${data.length} customers · ${adminCount} admins` : "Manage roles and permissions."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or phone"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          {(["all", "admins", "customers"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 h-8 rounded text-sm capitalize transition-colors ${
                filter === f ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          {(["list", "matrix"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 h-8 rounded text-sm capitalize transition-colors ${
                view === v ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No users match your filters.</p>
      ) : view === "matrix" ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium sticky left-0 bg-muted/50">User</th>
                {ADMIN_PERMISSIONS.map((p) => (
                  <th key={p} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                    {PERMISSION_LABELS[p].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 sticky left-0 bg-background">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(u.full_name, u.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.full_name || "Unnamed"}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {u.isAdmin ? "Admin" : u.email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  {ADMIN_PERMISSIONS.map((p) => {
                    const enabled = u.isAdmin || u.permissions.includes(p);
                    const toggling =
                      perm.isPending &&
                      perm.variables?.userId === u.id &&
                      perm.variables?.permission === p;
                    return (
                      <td key={p} className="px-3 py-3 text-center">
                        <div className="grid place-items-center">
                          {toggling ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Switch
                              checked={enabled}
                              disabled={u.isAdmin}
                              onCheckedChange={(v) =>
                                perm.mutate({ userId: u.id, permission: p, enabled: v })
                              }
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Spent</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const busy = role.isPending && role.variables?.userId === u.id;
                const isOpen = expanded === u.id;
                return (
                  <Fragment key={u.id}>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(u.full_name, u.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.full_name || "Unnamed"}</div>
                          <div className="text-muted-foreground truncate">{u.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-right">{u.orders}</td>
                    <td className="px-4 py-3 text-right">{u.spent.toFixed(2)} NIS</td>
                    <td className="px-4 py-3">
                      {u.isAdmin ? (
                        <Badge>Admin</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {u.permissions.length ? `${u.permissions.length} permissions` : "Customer"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpanded(isOpen ? null : u.id)}
                      >
                        <SlidersHorizontal className="size-4" />
                        Permissions
                        <ChevronDown
                          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </Button>
                      {u.isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => role.mutate({ userId: u.id, makeAdmin: false })}
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ShieldOff className="size-4" />
                          )}
                          Revoke admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => role.mutate({ userId: u.id, makeAdmin: true })}
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}
                          Make admin
                        </Button>
                      )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t bg-muted/30">
                      <td colSpan={6} className="px-4 py-4">
                        {u.isAdmin && (
                          <p className="mb-3 text-xs text-muted-foreground">
                            Admins have every capability. Revoke the admin role to set granular
                            permissions.
                          </p>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {ADMIN_PERMISSIONS.map((p) => {
                            const enabled = u.permissions.includes(p);
                            const meta = PERMISSION_LABELS[p];
                            const toggling =
                              perm.isPending &&
                              perm.variables?.userId === u.id &&
                              perm.variables?.permission === p;
                            return (
                              <div
                                key={p}
                                className="flex items-start justify-between gap-3 rounded-md border bg-background p-3"
                              >
                                <div className="min-w-0">
                                  <div className="font-medium">{meta.label}</div>
                                  <div className="text-xs text-muted-foreground">{meta.desc}</div>
                                </div>
                                {toggling ? (
                                  <Loader2 className="size-4 mt-1 animate-spin text-muted-foreground" />
                                ) : (
                                  <Switch
                                    checked={enabled}
                                    disabled={u.isAdmin}
                                    onCheckedChange={(v) =>
                                      perm.mutate({ userId: u.id, permission: p, enabled: v })
                                    }
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}