import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Tags, BarChart3, Users, Ticket, Loader2, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bootstrapAdmin, getIsAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/restaurants", label: "Restaurants", icon: Store },
  { to: "/admin/branches", label: "Branches", icon: Building2 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/foods", label: "Foods", icon: UtensilsCrossed },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/users", label: "Users", icon: Users },
];

function AdminLayout() {
  const check = useServerFn(getIsAdmin);
  const bootstrap = useServerFn(bootstrapAdmin);
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const { data, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => check(),
  });

  const bootstrapMut = useMutation({
    mutationFn: () => bootstrap(),
    onSuccess: () => {
      toast.success("You're now an admin");
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-4xl mb-3">Admin access required</h1>
        <p className="text-muted-foreground mb-8">
          If you are the first admin, you can claim the role now. Otherwise ask an existing admin to grant you access.
        </p>
        <Button onClick={() => bootstrapMut.mutate()} disabled={bootstrapMut.isPending}>
          {bootstrapMut.isPending ? "Promoting…" : "Become first admin"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="md:sticky md:top-24 self-start">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">Admin</div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as "/admin"}
                className={`flex items-center gap-2 rounded-md px-3 h-10 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}