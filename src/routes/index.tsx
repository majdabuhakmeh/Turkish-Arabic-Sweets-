import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Sparkles, Leaf, Star } from "lucide-react";
import heroAsset from "@/assets/sweet-kunafa-cream.jpg.asset.json";
import floatAsset from "@/assets/sweet-baklava-pistachio.jpg.asset.json";
import { foods, categories, localizedCategoryName } from "@/lib/foods";
import { FoodCard } from "@/components/FoodCard";
import { useI18n, useT } from "@/context/i18n";
import { NearestBranchBanner } from "@/components/NearestBranchBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Royal Sweets — حلويات الملكي · Handcrafted Levantine sweets" },
      {
        name: "description",
        content:
          "Royal Sweets — Al-Sumou's family confectionery for handcrafted baklava, kunafa and Levantine pastries. Boxed with care, delivered fresh.",
      },
      { property: "og:title", content: "Royal Sweets — حلويات الملكي" },
      { property: "og:description", content: "Handcrafted baklava, kunafa & Levantine pastries from Al-Sumou. Boxed with care, delivered fresh." },
      { property: "og:image", content: heroAsset.url },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const featured = foods.filter((f) => f.featured);
  const popular = foods.filter((f) => f.popular);
  const t = useT();
  const { locale } = useI18n();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {t("header.openNow")}
            </span>
            <h1 className="mt-8 font-display text-6xl sm:text-7xl lg:text-[7.5rem] leading-[0.95] text-balance">
              {t("home.h1.line1")}
              <br />
              <span className="italic text-primary">{t("home.h1.line2")}</span>
              <br />
              {t("home.h1.line3")}
            </h1>
            <p className="mt-8 max-w-md text-lg text-muted-foreground leading-relaxed">
              {t("home.intro")}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-3 rounded-full gradient-warm text-primary-foreground px-7 h-14 text-base font-medium shadow-warm hover:opacity-95 transition-all"
              >
                {t("home.orderNow")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 h-14 px-6 text-base font-medium text-foreground hover:text-primary transition-colors"
              >
                {t("home.ourStory")}
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                { icon: Clock, label: t("home.feature.delivery") },
                { icon: Sparkles, label: t("home.feature.fire") },
                { icon: Leaf, label: t("home.feature.local") },
              ].map((s) => (
                <div key={s.label} className="text-sm">
                  <s.icon className="size-5 text-primary mb-2" />
                  <div className="font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-warm">
              <img
                src={heroAsset.url}
                alt="Royal Sweets kunafa garnished with pistachio"
                width={1600}
                height={1600}
                className="size-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            </div>
            {/* Floating rating card */}
            <div className="absolute -left-4 bottom-8 lg:-left-12 rtl:left-auto rtl:right-4 rtl:lg:right-[-3rem] bg-card rounded-2xl p-5 shadow-soft max-w-[220px] border border-border">
              <div className="flex items-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm text-foreground/80 leading-snug">
                {t("home.review")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t("home.reviewBy")}</p>
            </div>
            {/* Floating special card */}
            <div className="hidden md:block absolute -right-4 top-10 rtl:right-auto rtl:-left-4 bg-card rounded-2xl p-3 shadow-soft border border-border">
              <div className="flex items-center gap-3">
                <img src={floatAsset.url} alt="" className="size-14 rounded-xl object-cover" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("home.todaysSpecial")}
                  </div>
                  <div className="font-display text-xl leading-tight">{t("home.specialOffer")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* decorative gold blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-[500px] rounded-full bg-primary/15 blur-3xl" />
      </section>

      {/* NEAREST BRANCH / ETA */}
      <section className="mx-auto max-w-7xl px-6 -mt-6">
        <NearestBranchBanner />
      </section>

      {/* CATEGORIES */}

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-4xl lg:text-5xl">{t("home.browse")}</h2>
          <Link to="/menu" className="text-sm text-primary hover:underline">
            {t("home.seeAll")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
          {categories.slice(1).map((c) => (
            <Link
              key={c.id}
              to="/menu"
              search={{ cat: c.id }}
              className="shrink-0 rounded-full border border-border bg-card px-6 h-12 inline-flex items-center text-sm font-medium hover:border-primary hover:text-primary transition-colors"
            >
              {localizedCategoryName(c, locale)}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED GRID */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.25em] text-primary">{t("home.chefsPicks")}</span>
          <h2 className="mt-3 font-display text-5xl lg:text-6xl">
            {t("home.featuredA")} <em className="text-primary not-italic">{t("home.featuredB")}</em> {t("home.featuredC")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}
        </div>
      </section>

      {/* POPULAR */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-4xl lg:text-5xl">{t("home.popular")}</h2>
          <Link to="/menu" className="hidden sm:inline text-sm text-primary hover:underline">
            {t("home.viewFull")}
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] gradient-warm p-12 lg:p-20 text-primary-foreground">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-5xl lg:text-6xl leading-tight">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              {t("home.ctaBody1")} <span className="font-semibold">ROYAL20</span> {t("home.ctaBody2")}
            </p>
            <Link
              to="/menu"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-foreground text-background px-7 h-14 text-base font-medium hover:bg-foreground/90 transition-colors"
            >
              {t("home.ctaButton")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-[400px] rounded-full bg-background/10 blur-2xl" />
        </div>
      </section>
    </div>
  );
}
