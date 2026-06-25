import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveRestaurants } from "@/lib/branches.functions";
import { MapPin } from "lucide-react";
import { NearestBranchBanner } from "@/components/NearestBranchBanner";

export const Route = createFileRoute("/r/")({
  head: () => ({
    meta: [
      { title: "Our Brands — Royal Sweets" },
      { name: "description", content: "Discover dessert shops and bakeries on the Royal Sweets platform." },
      { property: "og:title", content: "Our Brands — Royal Sweets" },
      { property: "og:description", content: "Discover dessert shops and bakeries on the Royal Sweets platform." },
    ],
  }),
  component: RestaurantsIndex,
});

function RestaurantsIndex() {
  const list = useServerFn(listActiveRestaurants);
  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants", "active"],
    queryFn: () => list(),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <span className="text-xs uppercase tracking-[0.25em] text-primary">Our Brands</span>
      <h1 className="mt-3 font-display text-6xl lg:text-7xl leading-none">
        Sweet houses, <em className="text-primary not-italic">one platform</em>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Browse dessert shops, bakeries, and sweet brands available on Royal Sweets.
      </p>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading brands…</p>
      ) : (
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              to="/r/$slug"
              params={{ slug: r.slug }}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
            >
              <div
                className="aspect-[16/10] w-full bg-muted bg-cover bg-center"
                style={r.cover_url ? { backgroundImage: `url(${r.cover_url})` } : undefined}
              />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  {r.logo_url && (
                    <img src={r.logo_url} alt={r.name} className="size-12 rounded-full object-cover border border-border" />
                  )}
                  <div>
                    <h3 className="font-display text-xl leading-tight">{r.name}</h3>
                    {r.contact_phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">{r.contact_phone}</p>
                    )}
                  </div>
                </div>
                {r.description && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                )}
                <div className="mt-5 inline-flex items-center gap-1 text-sm text-primary group-hover:underline">
                  <MapPin className="size-4" /> View brand
                </div>
              </div>
            </Link>
          ))}
          {restaurants.length === 0 && (
            <p className="text-muted-foreground col-span-full">No brands yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
