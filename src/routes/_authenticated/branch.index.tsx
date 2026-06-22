import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { getMyBranches } from "@/lib/vendor.functions";

export const Route = createFileRoute("/_authenticated/branch/")({
  component: BranchHome,
});

function BranchHome() {
  const list = useServerFn(getMyBranches);
  const { data } = useQuery({ queryKey: ["my-branches"], queryFn: () => list() });
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Your branches</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(data ?? []).map((b: any) => (
          <div key={b.id} className="rounded-xl border border-border p-5 flex items-start gap-4">
            <div className="size-12 rounded-full bg-muted grid place-items-center"><Building2 className="size-5 text-primary" /></div>
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.restaurant?.name} · {b.code} · {b.status}</div>
              {b.address && <div className="text-xs text-muted-foreground mt-1">{b.address}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
