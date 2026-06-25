import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crosshair, Loader2, MapPin, Clock, Truck, ChevronRight, AlertTriangle } from "lucide-react";
import { useBranch } from "@/context/branch";

const ASKED_KEY = "royalsweets.locationAsked";

/**
 * Auto-detects the customer's location on mount (once per browser) and shows
 * the nearest available branch with ETA, distance, and delivery fee BEFORE the
 * user lands on the menu. When `restaurantId` is provided, narrows ranking to
 * that brand's branches.
 */
export function NearestBranchBanner({ restaurantId }: { restaurantId?: string } = {}) {
  const { branches, selected, detectLocation, detecting, located, selectBranch } = useBranch();

  // Auto-prompt once per browser. Users can dismiss / decline and we won't nag.
  useEffect(() => {
    if (located || detecting) return;
    try {
      const asked = window.localStorage.getItem(ASKED_KEY);
      if (asked) return;
      window.localStorage.setItem(ASKED_KEY, "1");
    } catch {}
    void detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter to this restaurant's branches when scoped
  const scoped = restaurantId ? branches.filter((b) => b.restaurant_id === restaurantId) : branches;
  const ranked = located
    ? [...scoped].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
    : scoped;
  const nearestInRange = ranked.find((b) => b.in_range);
  const nearest = nearestInRange ?? ranked[0];

  // If the auto-pick doesn't match the currently selected branch within scope, sync it.
  useEffect(() => {
    if (!nearestInRange) return;
    if (selected?.id === nearestInRange.id) return;
    if (restaurantId && selected?.restaurant_id !== restaurantId) {
      selectBranch(nearestInRange.id);
    }
  }, [nearestInRange?.id, selected?.id, restaurantId, selectBranch]); // eslint-disable-line

  if (!scoped.length) return null;

  // Pre-location state — prompt
  if (!located) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 lg:p-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">
            <MapPin className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-xl lg:text-2xl leading-tight">
              Find your nearest branch
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your location and we'll show delivery time and fees before you start ordering.
            </p>
          </div>
        </div>
        <button
          onClick={() => detectLocation()}
          disabled={detecting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background h-12 px-6 text-sm font-medium hover:bg-primary transition-colors disabled:opacity-60"
        >
          {detecting ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          {detecting ? "Detecting…" : "Use my location"}
        </button>
      </div>
    );
  }

  // Located but no branch ranked (shouldn't happen) — fallback
  if (!nearest) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 flex items-center gap-3 text-sm text-muted-foreground">
        <AlertTriangle className="size-4 text-primary" />
        We couldn't find a branch near you yet.
      </div>
    );
  }

  const outOfRange = !nearestInRange;
  const currency = "SAR";

  return (
    <div
      className={`rounded-3xl border bg-card p-6 lg:p-8 ${
        outOfRange ? "border-amber-500/40" : "border-primary/40 shadow-soft"
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`size-12 rounded-full grid place-items-center shrink-0 ${
              outOfRange ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
            }`}
          >
            <MapPin className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">
              {outOfRange ? "Nearest branch (out of delivery range)" : "Delivering from"}
            </div>
            <h3 className="mt-1 font-display text-2xl lg:text-3xl leading-tight truncate">
              {nearest.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {nearest.address}
              {nearest.address && nearest.city ? ", " : ""}
              {nearest.city}
              {nearest.distance_km != null ? ` · ${nearest.distance_km} km away` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 lg:gap-4 lg:items-center">
          {nearest.eta_minutes != null && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
              <Clock className="size-4 text-primary" />
              <span className="font-medium">~{nearest.eta_minutes} min</span>
              <span className="text-muted-foreground">ETA</span>
            </div>
          )}
          {nearest.delivery_fee != null && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm">
              <Truck className="size-4 text-primary" />
              <span className="font-medium">
                {Number(nearest.delivery_fee).toFixed(2)} {currency}
              </span>
              <span className="text-muted-foreground">delivery</span>
            </div>
          )}
          <Link
            to="/menu"
            onClick={() => selectBranch(nearest.id)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background h-11 px-6 text-sm font-medium hover:bg-primary transition-colors"
          >
            Browse menu <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {outOfRange && (
        <p className="mt-4 text-xs text-amber-700/90 flex items-center gap-2">
          <AlertTriangle className="size-3.5" />
          You're outside this branch's delivery radius
          {nearest.delivery_radius_km ? ` (${nearest.delivery_radius_km} km)` : ""}. Pickup may still be available.
        </p>
      )}
    </div>
  );
}
