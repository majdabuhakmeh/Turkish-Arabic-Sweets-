import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  const { selectBranch, selected } = useBranch();
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["restaurant", slug],
    queryFn: () => fetcher({ data: { slug } }),
    staleTime: 60_000,
  });

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

                  <button
                    onClick={() => visitMenu(b.id)}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background h-11 text-sm font-medium hover:bg-primary transition-colors"
                  >
                    Order from this branch <ChevronRight className="size-4" />
                  </button>
                </div>
              );
            })}
            {branches.length === 0 && (
              <p className="text-muted-foreground col-span-full">No active branches yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
