import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { FoodCard } from "@/components/FoodCard";
import { foods } from "@/lib/foods";
import { useFavorites } from "@/context/favorites";
import { useT } from "@/context/i18n";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Your favorites — Royal Sweets" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids, loading } = useFavorites();
  const t = useT();
  const list = foods.filter((f) => ids.has(f.id));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-primary/10 text-primary grid place-items-center">
          <Heart className="size-6 fill-current" />
        </div>
        <div>
          <h1 className="font-display text-5xl md:text-6xl">{t("fav.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("fav.subtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-3xl bg-card animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-muted-foreground">{t("fav.empty")}</p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center rounded-full bg-foreground text-background px-6 h-12 text-sm font-medium hover:bg-primary transition-colors"
          >
            {t("fav.browse")}
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}
        </div>
      )}
    </div>
  );
}