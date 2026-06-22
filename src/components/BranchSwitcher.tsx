import { useState } from "react";
import { MapPin, ChevronDown, Crosshair, Check, Loader2 } from "lucide-react";
import { useBranch } from "@/context/branch";

export function BranchSwitcher({ compact = false }: { compact?: boolean }) {
  const { branches, selected, selectBranch, detectLocation, detecting } = useBranch();
  const [open, setOpen] = useState(false);

  if (!branches.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 h-11 text-sm hover:border-foreground transition-colors max-w-[220px]"
      >
        <MapPin className="size-4 text-primary shrink-0" />
        <span className="truncate">
          {selected ? selected.name : "Pick a branch"}
          {!compact && selected?.distance_km != null && (
            <span className="text-muted-foreground"> · {selected.distance_km} km</span>
          )}
        </span>
        <ChevronDown className="size-3.5 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Choose a branch
              </div>
              <button
                onClick={() => detectLocation()}
                disabled={detecting}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {detecting ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
                Use my location
              </button>
            </div>
            <ul className="max-h-80 overflow-auto">
              {branches.map((b) => {
                const active = selected?.id === b.id;
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        selectBranch(b.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 hover:bg-muted transition-colors flex items-start gap-2 ${
                        active ? "bg-muted/50" : ""
                      }`}
                    >
                      <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate flex items-center gap-2">
                          {b.name}
                          {b.distance_km != null && (
                            <span className="text-xs text-muted-foreground">
                              {b.distance_km} km {b.in_range ? "· in range" : "· out of range"}
                            </span>
                          )}
                        </div>
                        {b.address && (
                          <div className="text-xs text-muted-foreground truncate">{b.address}</div>
                        )}
                        {b.eta_minutes != null && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            ETA ~{b.eta_minutes} min · Delivery {Number(b.delivery_fee ?? 0)} SAR
                          </div>
                        )}
                      </div>
                      {active && <Check className="size-4 text-primary shrink-0 mt-1" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
