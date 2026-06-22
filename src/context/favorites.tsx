import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";

type FavoritesCtx = {
  ids: Set<string>;
  isFavorite: (foodId: string) => boolean;
  toggle: (foodId: string) => Promise<void>;
  loading: boolean;
};

const Ctx = createContext<FavoritesCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from("favorites")
      .select("food_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) setIds(new Set(data.map((r) => r.food_id)));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(
    async (foodId: string) => {
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }
      const has = ids.has(foodId);
      const next = new Set(ids);
      if (has) next.delete(foodId);
      else next.add(foodId);
      setIds(next);
      if (has) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("food_id", foodId);
        if (error) {
          setIds(ids);
          toast.error(error.message);
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, food_id: foodId });
        if (error) {
          setIds(ids);
          toast.error(error.message);
        }
      }
    },
    [ids, user],
  );

  return (
    <Ctx.Provider value={{ ids, isFavorite: (id) => ids.has(id), toggle, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites outside provider");
  return c;
}