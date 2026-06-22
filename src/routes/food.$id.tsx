import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Flame, Minus, Plus, Star } from "lucide-react";
import { getFood } from "@/lib/foods";
import { useCart } from "@/context/cart";
import { FoodReviews } from "@/components/FoodReviews";

export const Route = createFileRoute("/food/$id")({
  loader: ({ params }) => {
    const food = getFood(params.id);
    if (!food) throw notFound();
    return { food };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.food.name} — Saffron Kitchen` },
            { name: "description", content: loaderData.food.description },
            { property: "og:image", content: loaderData.food.image },
          ],
        }
      : {},
  component: FoodPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="font-display text-5xl">Dish not found</h1>
      <Link to="/menu" className="mt-6 inline-block text-primary">Back to menu</Link>
    </div>
  ),
});

function FoodPage() {
  const { food } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to menu
      </Link>

      <div className="mt-8 grid lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="relative">
          <div className="aspect-square rounded-[2.5rem] overflow-hidden shadow-warm">
            <img
              src={food.image}
              alt={food.name}
              width={1000}
              height={1000}
              className="size-full object-cover"
            />
          </div>
          <div className="absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-4 py-2 text-sm font-medium">
            <Star className="size-4 fill-secondary text-secondary" />
            {food.rating} <span className="text-muted-foreground">({food.reviews})</span>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-primary">
            {food.category}
          </span>
          <h1 className="mt-3 font-display text-6xl leading-none">{food.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{food.tagline}</p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-5xl text-primary">${food.price}</span>
            {food.originalPrice && (
              <span className="text-xl text-muted-foreground line-through">
                ${food.originalPrice}
              </span>
            )}
          </div>

          <div className="mt-8 flex gap-6 text-sm">
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 text-primary" /> {food.prepTime} min
            </span>
            <span className="inline-flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              {["Mild", "Medium", "Hot", "Fire"][food.spice]}
            </span>
            <span>{food.calories} cal</span>
          </div>

          <p className="mt-8 text-foreground/80 leading-relaxed">{food.description}</p>

          <div className="mt-8">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Ingredients
            </h3>
            <div className="flex flex-wrap gap-2">
              {food.ingredients.map((i: string) => (
                <span
                  key={i}
                  className="rounded-full bg-card border border-border px-3 py-1 text-sm"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-border bg-card h-14">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="size-14 grid place-items-center hover:text-primary"
                aria-label="Decrease"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="size-14 grid place-items-center hover:text-primary"
                aria-label="Increase"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              onClick={() => add(food.id, qty)}
              className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-medium shadow-warm hover:bg-primary/90 transition-colors"
            >
              Add {qty} to bag — ${(food.price * qty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>

    <FoodReviews foodId={food.id} />
    </div>
  );
}
