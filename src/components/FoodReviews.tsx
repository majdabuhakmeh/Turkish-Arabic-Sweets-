import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "./StarRating";
import { Loader2 } from "lucide-react";
import { useT } from "@/context/i18n";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export function FoodReviews({ foodId }: { foodId: string }) {
  const t = useT();
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("reviews")
      .select("id,user_id,rating,comment,created_at")
      .eq("food_id", foodId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setReviews((data as Review[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [foodId]);

  if (!reviews) {
    return (
      <div className="py-10 grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="mt-20 border-t border-border pt-12">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-display text-4xl">{t("reviews.title")}</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3">
            <StarRating value={avg} readOnly />
            <span className="font-display text-2xl">{avg.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({reviews.length} {t("reviews.count")})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t("reviews.empty")}</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <StarRating value={r.rating} readOnly size={16} />
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.comment && (
                <p className="mt-3 text-foreground/80 leading-relaxed">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}