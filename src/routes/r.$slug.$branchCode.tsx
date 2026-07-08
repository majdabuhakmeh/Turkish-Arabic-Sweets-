import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBranchLanding } from "@/lib/branches.functions";
import { useBranch } from "@/context/branch";
import { MapPin, Phone, Clock, Truck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Route = createFileRoute("/r/$slug/$branchCode")({
  head: ({ params }) => {
    const title = `${params.branchCode} · ${params.slug} — Royal Sweets`;
    const desc = `Order fresh sweets from the ${params.branchCode} branch of ${params.slug}. Browse the menu, opening hours, delivery ETA, and more on Royal Sweets.`;
    const url = `https://royal-sweet-palette.lovable.app/r/${params.slug}/${params.branchCode}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BranchLandingPage,
});

function BranchLandingPage() {
  const { slug, branchCode } = Route.useParams();
  const navigate = useNavigate();
  const fetcher = useServerFn(getBranchLanding);
  const { selectBranch, setRestaurantScope } = useBranch();
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["branch-landing", slug, branchCode],
    queryFn: () => fetcher({ data: { slug, branchCode } }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data?.restaurant?.id) return;
    setRestaurantScope(data.restaurant.id);
    return () => setRestaurantScope(null);
  }, [data?.restaurant?.id, setRestaurantScope]);

  // Auto-select this branch when the page loads.
  useEffect(() => {
    if (data?.branch?.id) selectBranch(data.branch.id);
  }, [data?.branch?.id, selectBranch]);

  const filteredFoods = useMemo(() => {
    const list = data?.foods ?? [];
    const f = activeCat === "all" ? list : list.filter((x) => x.category_slug === activeCat);
    return [...f].sort((a, b) => Number(b.available) - Number(a.available));
  }, [data, activeCat]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-6 py-20 text-muted-foreground">Loading…</div>;
  }
  if (isError || !data?.restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="font-display text-4xl">Brand not found</h1>
        <Link to="/r" className="mt-6 inline-flex items-center gap-1 text-primary hover:underline">
          View all brands <ChevronRight className="size-4" />
        </Link>
      </div>
    );
  }
  if (!data.branch) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="font-display text-4xl">Branch not found</h1>
        <p className="mt-4 text-muted-foreground">
          We couldn't find branch "{branchCode}" for {data.restaurant.name}.
        </p>
        <Link
          to="/r/$slug"
          params={{ slug }}
          className="mt-6 inline-flex items-center gap-1 text-primary hover:underline"
        >
          View all {data.restaurant.name} branches <ChevronRight className="size-4" />
        </Link>
      </div>
    );
  }

  const { restaurant, branch, categories } = data;
  const currency = restaurant.currency ?? "SAR";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hours = (branch.opening_hours ?? null) as any;

  return (
    <div className="pb-20">
      <div
        className="relative h-64 lg:h-96 w-full bg-muted bg-cover bg-center"
        style={restaurant.cover_url ? { backgroundImage: `url(${restaurant.cover_url})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-16 lg:-mt-20 relative">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <Link to="/r" className="hover:text-foreground">Brands</Link>
          <ChevronRight className="size-3" />
          <Link to="/r/$slug" params={{ slug }} className="hover:text-foreground">{restaurant.name}</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{branch.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="size-28 lg:size-36 rounded-3xl object-cover border-4 border-background bg-card shadow-xl"
            />
          ) : (
            <div className="size-28 lg:size-36 rounded-3xl border-4 border-background bg-card shadow-xl flex items-center justify-center font-display text-3xl">
              {restaurant.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <span className="text-xs uppercase tracking-[0.25em] text-primary">
              Royal Sweets · {restaurant.name}
            </span>
            <h1 className="mt-2 font-display text-5xl lg:text-6xl leading-none">{branch.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground uppercase tracking-wider">
              Branch code · {branch.code}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate({ to: "/checkout" })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground h-12 px-6 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Order from this branch <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => navigate({ to: "/menu" })}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border h-12 px-6 text-sm font-medium hover:border-foreground transition-colors"
            >
              Browse menu
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(branch.address || branch.city) && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Location
              </div>
              <p className="mt-2 text-sm">
                {branch.address}
                {branch.address && branch.city ? ", " : ""}
                {branch.city}
                {branch.country ? `, ${branch.country}` : ""}
              </p>
            </div>
          )}
          {branch.phone && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Phone className="size-4 text-primary" /> Phone
              </div>
              <a href={`tel:${branch.phone}`} className="mt-2 block text-sm hover:text-primary">
                {branch.phone}
              </a>
            </div>
          )}
          {branch.eta_minutes != null && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Delivery ETA
              </div>
              <p className="mt-2 text-sm">{branch.eta_minutes} minutes</p>
            </div>
          )}
          {branch.delivery_fee != null && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Truck className="size-4 text-primary" /> Delivery
              </div>
              <p className="mt-2 text-sm">
                {formatCurrency(branch.delivery_fee, currency)}
                {branch.delivery_radius_km ? ` · within ${branch.delivery_radius_km} km` : ""}
              </p>
              {branch.min_order != null && Number(branch.min_order) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min order {formatCurrency(branch.min_order, currency)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Opening hours */}
        {hours && typeof hours === "object" && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl flex items-center gap-2">
              <Clock className="size-5 text-primary" /> Opening hours
            </h2>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              {DAY_LABELS.map((label, i) => {
                const key = label.toLowerCase();
                const v = hours[key] ?? hours[String(i)] ?? hours[label];
                let display = "Closed";
                if (v) {
                  if (typeof v === "string") display = v;
                  else if (Array.isArray(v)) display = v.join(", ");
                  else if (typeof v === "object" && (v.open || v.close))
                    display = `${v.open ?? "—"} – ${v.close ?? "—"}`;
                }
                return (
                  <div key={label} className="flex items-center justify-between border-b border-border/50 py-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{display}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="mt-16">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-primary">Menu</span>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl">Available at {branch.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Live pricing and availability for this branch.
              </p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCat("all")}
                className={`shrink-0 rounded-full px-5 h-10 text-sm font-medium transition-all ${
                  activeCat === "all"
                    ? "bg-foreground text-background"
                    : "bg-card border border-border hover:border-foreground"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.slug)}
                  className={`shrink-0 rounded-full px-5 h-10 text-sm font-medium transition-all ${
                    activeCat === c.slug
                      ? "bg-foreground text-background"
                      : "bg-card border border-border hover:border-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map((f) => {
              const discounted = f.effective_price < f.price;
              const lowStock = f.stock != null && f.stock > 0 && f.stock <= 5;
              return (
                <article
                  key={f.id}
                  className={`group relative overflow-hidden rounded-3xl bg-card shadow-soft transition-transform duration-500 ${
                    f.available ? "hover:-translate-y-1" : "opacity-75"
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {f.image_url ? (
                      <img
                        src={f.image_url}
                        alt={f.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="size-full grid place-items-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                    {!f.available && (
                      <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                        <span className="rounded-full bg-foreground text-background text-xs font-semibold tracking-wider uppercase px-4 py-2">
                          Sold out · {branch.name}
                        </span>
                      </div>
                    )}
                    {f.available && lowStock && (
                      <div className="absolute top-4 left-4 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold tracking-wider uppercase px-3 py-1">
                        Only {f.stock} left
                      </div>
                    )}
                    {discounted && (
                      <div className="absolute top-4 right-4 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold tracking-wider uppercase px-3 py-1">
                        Branch price
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-2xl leading-tight">{f.name}</h3>
                      <div className="text-right">
                        {discounted && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(f.price, currency)}
                          </div>
                        )}
                        <div className="font-display text-2xl text-primary">
                          {formatCurrency(f.effective_price, currency)}
                        </div>
                      </div>
                    </div>
                    {f.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{f.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      {f.available ? (
                        <Badge variant="secondary" className="rounded-full">Available now</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full">Unavailable</Badge>
                      )}
                      {f.is_featured && <Badge className="rounded-full">Featured</Badge>}
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredFoods.length === 0 && (
              <p className="text-muted-foreground col-span-full py-10 text-center">
                No items in this category yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
