import { Link } from "@tanstack/react-router";
import { Star, Clock, Plus, Heart } from "lucide-react";
import { localizedFood, type Food } from "@/lib/foods";
import { useCart } from "@/context/cart";
import { useI18n, useT } from "@/context/i18n";
import { useFavorites } from "@/context/favorites";

export function FoodCard({ food }: { food: Food }) {
  const { add } = useCart();
  const { locale } = useI18n();
  const t = useT();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(food.id);
  const l = localizedFood(food, locale);
  return (
    <article className="group relative">
      <Link
        to="/food/$id"
        params={{ id: food.id }}
        className="block overflow-hidden rounded-3xl bg-card shadow-soft transition-transform duration-500 hover:-translate-y-1"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={food.image}
            alt={l.name}
            width={800}
            height={1000}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {food.originalPrice && (
            <div className="absolute top-4 left-4 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold tracking-wider uppercase px-3 py-1">
              {t("card.save")} ${food.originalPrice - food.price}
            </div>
          )}
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium">
            <Star className="size-3 fill-secondary text-secondary" />
            {food.rating}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-2xl leading-tight">{l.name}</h3>
            <div className="text-right">
              {food.originalPrice && (
                <div className="text-xs text-muted-foreground line-through">
                  ${food.originalPrice}
                </div>
              )}
              <div className="font-display text-2xl text-primary">${food.price}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{l.tagline}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {food.prepTime} {t("card.min")}
            </span>
            <span>{food.calories} {t("card.cal")}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(food.id);
        }}
        aria-label={fav ? t("fav.remove") : t("fav.add")}
        aria-pressed={fav}
        className={`absolute top-20 right-5 rtl:right-auto rtl:left-5 size-10 rounded-full grid place-items-center backdrop-blur shadow-soft transition-all ${
          fav
            ? "bg-primary text-primary-foreground"
            : "bg-background/90 text-foreground hover:scale-110"
        }`}
      >
        <Heart className={`size-4 ${fav ? "fill-current" : ""}`} />
      </button>
      <button
        onClick={() => add(food.id)}
        aria-label={`${t("card.add")} ${l.name}`}
        className="absolute bottom-5 right-5 size-12 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-warm hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="size-5" />
      </button>
    </article>
  );
}
