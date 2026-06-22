import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Package, BarChart3, Loader2, Building2 } from "lucide-react";
import { getMyBranches } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/branch")({
  component: BranchManagerLayout,
});

const nav: { to: string; label: string; icon: typeof Building2; exact?: boolean }[] = [
  { to: "/branch", label: "Branches", icon: Building2, exact: true },
  { to: "/branch/orders", label: "Orders", icon: ShoppingBag },
  { to: "/branch/inventory", label: "Inventory", icon: Package },
  { to: "/branch/reports", label: "Reports", icon: BarChart3 },
];

function BranchManagerLayout() {
  const list = useServerFn(getMyBranches);
  const { data, isLoading } = useQuery({ queryKey: ["my-branches"], queryFn: () => list() });
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!data?.length) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl mb-3">No branches assigned</h1>
        <p className="text-muted-foreground">A restaurant owner needs to assign you as branch manager or staff before you can use this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="md:sticky md:top-24 self-start">
        <div className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">Branch manager</div>
        <nav className="flex md:flex-col gap-1">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to as "/"} className={`flex items-center gap-2 rounded-md px-3 h-10 text-sm transition-colors ${active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-muted"}`}>
                <Icon className="size-4" />{n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0"><Outlet /></main>
    </div>
  );
}
