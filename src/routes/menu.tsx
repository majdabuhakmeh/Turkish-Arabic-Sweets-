import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { foods, categories, localizedCategoryName, localizedFood } from "@/lib/foods";
import { FoodCard } from "@/components/FoodCard";
import { Search as SearchIcon, MapPin } from "lucide-react";
import { useI18n, useT } from "@/context/i18n";
import { useBranch } from "@/context/branch";
import { BranchSwitcher } from "@/components/BranchSwitcher";

type SearchParams = { cat?: string };

export const Route = createFileRoute("/menu")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Menu — Royal Sweets" },
      { name: "description", content: "Browse our full menu of wood-fired pizzas, smash burgers, hand-cut pasta, shawarma, salads and desserts." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { cat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const t = useT();
  const { locale } = useI18n();
  const { selected, isAvailable } = useBranch();

  const active = cat ?? "all";
  const filtered = foods
    .filter((f) => {
      const l = localizedFood(f, locale);
      const term = q.toLowerCase();
      return (
        (active === "all" || f.category === active) &&
        (q === "" ||
          f.name.toLowerCase().includes(term) ||
          l.name.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => Number(isAvailable(b.id)) - Number(isAvailable(a.id)));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="max-w-3xl">
        <span className="text-xs uppercase tracking-[0.25em] text-primary">{t("menu.kicker")}</span>
        <h1 className="mt-3 font-display text-6xl lg:text-7xl leading-none">
          {t("menu.titleA")} <em className="text-primary not-italic">{t("menu.titleB")}</em>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {t("menu.subtitle")}
        </p>
        {selected && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <MapPin className="size-4 text-primary" />
            <span className="text-muted-foreground">Showing menu for</span>
            <span className="font-medium">{selected.name}</span>
            {selected.city && <span className="text-muted-foreground">· {selected.city}</span>}
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                navigate({ search: { cat: c.id === "all" ? undefined : c.id } })
              }
              className={`shrink-0 rounded-full px-5 h-11 text-sm font-medium transition-all ${
                active === c.id
                  ? "bg-foreground text-background"
                  : "bg-card border border-border hover:border-foreground"
              }`}
            >
              {localizedCategoryName(c, locale)}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <SearchIcon className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("menu.search")}
            className="w-full h-11 pl-11 pr-4 rtl:pl-4 rtl:pr-11 rounded-full bg-card border border-border text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((f) => (
          <FoodCard key={f.id} food={f} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-20">
          {t("menu.empty")}
        </p>
      )}
    </div>
  );
}
