import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRestaurantBySlug, getRestaurantMenu } from "@/lib/branches.functions";
import { useBranch } from "@/context/branch";
import { MapPin, Phone, Mail, Clock, Truck, ChevronRight, AlertCircle } from "lucide-react";
import { NearestBranchBanner } from "@/components/NearestBranchBanner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/r/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Royal Sweets` },
      { name: "description", content: `Order from ${params.slug} on Royal Sweets — browse branches, menus, and delivery options.` },
      { property: "og:title", content: `${params.slug} — Royal Sweets` },
      { property: "og:description", content: `Order from ${params.slug} on Royal Sweets.` },
    ],
  }),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetcher = useServerFn(getRestaurantBySlug);
  const menuFetcher = useServerFn(getRestaurantMenu);
  const { selectBranch, selected, setRestaurantScope } = useBranch();
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["restaurant", slug],
    queryFn: () => fetcher({ data: { slug } }),
    staleTime: 60_000,
  });

  // Scope branch selection to this restaurant so per-restaurant memory applies.
  useEffect(() => {
    if (!data?.restaurant?.id) return;
    setRestaurantScope(data.restaurant.id);
    return () => setRestaurantScope(null);
  }, [data?.restaurant?.id, setRestaurantScope]);

  // Only filter the inventory overlay by branch when that branch belongs to this restaurant.
  const branchForMenu =
    selected && data?.restaurant && selected.restaurant_id === data.restaurant.id
      ? selected
      : null;

  const { data: menu } = useQuery({
    queryKey: ["restaurant-menu", slug, branchForMenu?.id ?? null],
    queryFn: () =>
      menuFetcher({ data: { slug, branchId: branchForMenu?.id } }),
    enabled: !!data?.restaurant,
    staleTime: 30_000,
  });

  const filteredFoods = useMemo(() => {
    const list = menu?.foods ?? [];
    const f = activeCat === "all" ? list : list.filter((x) => x.category_slug === activeCat);
    return [...f].sort((a, b) => Number(b.available) - Number(a.available));
  }, [menu, activeCat]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-6 py-20 text-muted-foreground">Loading…</div>;
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="font-display text-4xl">Brand not found</h1>
        <p className="mt-4 text-muted-foreground">We couldn't find a brand with this slug.</p>
        <Link to="/r" className="mt-6 inline-flex items-center gap-1 text-primary hover:underline">
          View all brands <ChevronRight className="size-4" />
        </Link>
      </div>
    );
  }

  const { restaurant, branches } = data;

  const visitMenu = (branchId: string) => {
    selectBranch(branchId);
    navigate({ to: "/menu" });
  };

  return (
    <div className="pb-20">
      {/* Cover */}
      <div
        className="relative h-64 lg:h-96 w-full bg-muted bg-cover bg-center"
        style={restaurant.cover_url ? { backgroundImage: `url(${restaurant.cover_url})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-16 lg:-mt-20 relative">
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
            <span className="text-xs uppercase tracking-[0.25em] text-primary">Royal Sweets Brand</span>
            <h1 className="mt-2 font-display text-5xl lg:text-6xl leading-none">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="mt-4 max-w-2xl text-muted-foreground">{restaurant.description}</p>
            )}
          </div>
        </div>

        {/* Contact */}
        {(restaurant.contact_phone || restaurant.contact_email) && (
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            {restaurant.contact_phone && (
              <a
                href={`tel:${restaurant.contact_phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 hover:border-primary"
              >
                <Phone className="size-4 text-primary" /> {restaurant.contact_phone}
              </a>
            )}
            {restaurant.contact_email && (
              <a
                href={`mailto:${restaurant.contact_email}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 hover:border-primary"
              >
                <Mail className="size-4 text-primary" /> {restaurant.contact_email}
              </a>
            )}
          </div>
        )}

        {/* Nearest branch + ETA */}
        <div className="mt-10">
          <NearestBranchBanner restaurantId={restaurant.id} />
        </div>



        {/* Branches */}
        <div className="mt-16">
          <h2 className="font-display text-3xl lg:text-4xl">
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </h2>
          <p className="mt-2 text-muted-foreground">Pick a branch to start ordering.</p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b) => {
              const isSelected = selected?.id === b.id;
              return (
                <div
                  key={b.id}
                  className={`rounded-3xl border bg-card p-6 transition-all ${
                    isSelected ? "border-primary shadow-md" : "border-border hover:border-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl leading-tight">{b.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{b.code}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary text-primary-foreground px-2 py-1">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {(b.address || b.city) && (
                      <p className="flex items-start gap-2">
                        <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                        <span>
                          {b.address}
                          {b.address && b.city ? ", " : ""}
                          {b.city}
                          {b.country ? `, ${b.country}` : ""}
                        </span>
                      </p>
                    )}
                    {b.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-4 text-primary shrink-0" /> {b.phone}
                      </p>
                    )}
                    {b.eta_minutes != null && (
                      <p className="flex items-center gap-2">
                        <Clock className="size-4 text-primary shrink-0" /> {b.eta_minutes} min ETA
                      </p>
                    )}
                    {b.delivery_fee != null && (
                      <p className="flex items-center gap-2">
                        <Truck className="size-4 text-primary shrink-0" />
                        Delivery {Number(b.delivery_fee).toFixed(2)} {restaurant.currency ?? "SAR"}
                        {b.delivery_radius_km ? ` · within ${b.delivery_radius_km} km` : ""}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => visitMenu(b.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background h-11 text-sm font-medium hover:bg-primary transition-colors"
                    >
                      Order now
                    </button>
                    <Link
                      to="/r/$slug/$branchCode"
                      params={{ slug, branchCode: b.code }}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-border h-11 px-4 text-sm font-medium hover:border-foreground transition-colors"
                    >
                      Details <ChevronRight className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && (
              <p className="text-muted-foreground col-span-full">No active branches yet.</p>
            )}
          </div>
        </div>

        {/* Menu — branch aware */}
        <div className="mt-20">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-primary">Menu</span>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl">What's on offer</h2>
              {branchForMenu ? (
                <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Pricing &amp; availability for{" "}
                  <span className="font-medium text-foreground">{branchForMenu.name}</span>
                  {branchForMenu.city ? <span>· {branchForMenu.city}</span> : null}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  Pick a branch above to see live availability and pricing.
                </p>
              )}
            </div>
          </div>

          {/* Category filter */}
          {(menu?.categories?.length ?? 0) > 0 && (
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
              {menu!.categories.map((c) => (
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
              const discounted =
                branchForMenu && f.effective_price < f.price;
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
                          {branchForMenu ? `Sold out · ${branchForMenu.name}` : "Sold out"}
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
                            {f.price.toFixed(2)} {restaurant.currency ?? "SAR"}
                          </div>
                        )}
                        <div className="font-display text-2xl text-primary">
                          {f.effective_price.toFixed(2)} {restaurant.currency ?? "SAR"}
                        </div>
                      </div>
                    </div>
                    {f.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{f.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      {f.available ? (
                        <Badge variant="secondary" className="rounded-full">
                          Available now
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full">
                          Unavailable
                        </Badge>
                      )}
                      {f.is_featured && (
                        <Badge className="rounded-full">Featured</Badge>
                      )}
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
