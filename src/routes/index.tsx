import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Clock, Sparkles, Leaf, Star, Plus } from "lucide-react";
import heroAsset from "@/assets/hero.jpg";
import kunafaTrayImg from "@/assets/كنافة نابلسية.jpg";
import baklavaTrayImg from "@/assets/baqlwa.jpg";
import kellajTrayImg from "@/assets/kolaj.jpg";
import { foods, categories, localizedCategoryName, localizedFood } from "@/lib/foods";
import { useI18n, useT } from "@/context/i18n";
import { useCart } from "@/context/cart";
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
      { property: "og:image", content: heroAsset },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const popular = foods.filter((f) => f.popular);
  const t = useT();
  const { locale } = useI18n();
  const { add } = useCart();
  const [hoveredTray, setHoveredTray] = useState<string | null>(null);

  const trays = [
    {
      key: "kunafa",
      foodId: "kunafa-cheese",
      image: kunafaTrayImg,
      name: locale === "ar" ? "كنافة نابلسية" : "Kunafa Nabulsiya",
      desc:
        locale === "ar"
          ? "جبنة عكاوي طازجة، قطر بماء الورد، وطبقة قطايف مقرمشة محمّرة بالسمن البلدي."
          : "Fresh akkawi cheese, rose-water syrup, and a crisp semolina crust browned in clarified butter.",
    },
    {
      key: "baklava",
      foodId: "baklava-pistachio",
      image: baklavaTrayImg,
      name: locale === "ar" ? "بقلاوة بالفستق" : "Pistachio Baklava",
      desc:
        locale === "ar"
          ? "أربعون طبقة فيلو رقيقة، فستق حلبي مطحون، وقطر عسل مركّز."
          : "Forty paper-thin phyllo layers, crushed Aleppo pistachio, and concentrated honey syrup.",
    },
    {
      key: "kellaj",
      foodId: "warbat",
      image: kellajTrayImg,
      name: locale === "ar" ? "كلاج" : "Kellaj",
      desc:
        locale === "ar"
          ? "عجينة كلاج مقرمشة محشوّة جوز أو جبنة، مقليّة ذهبية ومغمّسة بالقطر."
          : "Crisp kellaj pastry filled with walnut or cheese, fried golden and dipped in syrup.",
    },
  ];
  const activeTray = trays.find((tr) => tr.key === hoveredTray);

  return (
    <div>
      {/* HERO */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroAsset})` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,var(--hero-overlay-top)) 0%, rgba(0,0,0,var(--hero-overlay-bottom)) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative z-10">
            <span
              className="animate-hero-in inline-flex items-center gap-2 rounded-full border border-background/30 bg-background/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-background backdrop-blur"
              style={{ animationDelay: "0s" }}
            >
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {t("header.openNow")}
            </span>
            <h1
              className="animate-hero-in mt-8 font-display text-6xl sm:text-7xl lg:text-[7.5rem] leading-[0.95] text-balance text-background"
              style={{ animationDelay: "0.2s" }}
            >
              {t("home.h1.line1")}
              <br />
              <span className="italic text-primary">{t("home.h1.line2")}</span>
              <br />
              {t("home.h1.line3")}
            </h1>
            <p
              className="animate-hero-in mt-8 max-w-md text-lg text-background/80 leading-relaxed"
              style={{ animationDelay: "0.4s" }}
            >
              {t("home.intro")}
            </p>
            <div
              className="animate-hero-in mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.6s" }}
            >
              <Link
                to="/menu"
                className="group inline-flex items-center gap-3 rounded-full gradient-warm text-primary-foreground px-7 h-14 text-base font-medium shadow-warm hover:opacity-95 transition-all"
              >
                {t("home.orderNow")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 h-14 px-6 text-base font-medium text-background hover:text-primary transition-colors"
              >
                {t("home.ourStory")}
              </Link>
            </div>

            <div
              className="animate-hero-in mt-14 grid grid-cols-3 gap-6 max-w-md"
              style={{ animationDelay: "0.8s" }}
            >
              {[
                { icon: Clock, label: t("home.feature.delivery") },
                { icon: Sparkles, label: t("home.feature.fire") },
                { icon: Leaf, label: t("home.feature.local") },
              ].map((s) => (
                <div key={s.label} className="text-sm text-background">
                  <s.icon className="size-5 text-primary mb-2" />
                  <div className="font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-warm">
              <img
                src={heroAsset}
                alt="Royal Sweets tray assortment"
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
            {/* Floating special card — temporarily hidden, set to true to bring back */}
            {false && (
              <div className="hidden md:block absolute -right-4 top-10 rtl:right-auto rtl:-left-4 bg-card rounded-2xl p-3 shadow-soft border border-border">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("home.todaysSpecial")}
                    </div>
                    <div className="font-display text-xl leading-tight">{t("home.specialOffer")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* decorative gold blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-[500px] rounded-full bg-primary/15 blur-3xl" />
      </section>

      {/* PRODUCTS MARQUEE */}
      <section dir="ltr" className="group overflow-hidden border-y border-border/60 py-8 bg-card/60">
        <div
          className={`flex w-max gap-12 animate-marquee group-hover:[animation-play-state:paused] ${
            locale === "ar" ? "[animation-direction:reverse]" : ""
          }`}
        >
          {[...foods, ...foods].map((food, i) => (
            <div key={`${food.id}-${i}`} className="flex items-center gap-3 shrink-0">
             
              <span className="font-display text-lg whitespace-nowrap">
                {localizedFood(food, locale).name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* NEAREST BRANCH / ETA */}
      <section className="mx-auto max-w-7xl px-6 -mt-6">
        <NearestBranchBanner />
      </section>

      {/* CATEGORIES — temporarily hidden, set to true to bring back */}
      {false && (
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
      )}

      {/* FEATURED GRID */}
      <section
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-cover bg-center px-6 py-12 transition-[background-image] duration-700"
        style={activeTray ? { backgroundImage: `url(${activeTray.image})` } : undefined}
      >
        {activeTray && <div className="absolute inset-0 bg-foreground/65 transition-opacity duration-700" />}
        <div className="relative mb-10 max-w-2xl">
          <span
            className={`text-xs uppercase tracking-[0.25em] transition-colors ${activeTray ? "text-background" : "text-primary"}`}
          >
            {t("home.chefsPicks")}
          </span>
          <h2
            className={`mt-3 font-display text-5xl lg:text-6xl transition-colors ${activeTray ? "text-background" : ""}`}
          >
            {t("home.featuredA")} <em className="text-primary not-italic">{t("home.featuredB")}</em> {t("home.featuredC")}
          </h2>
        </div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trays.map((tray) => (
            <Link
              key={tray.key}
              to="/food/$id"
              params={{ id: tray.foodId }}
              onMouseEnter={() => setHoveredTray(tray.key)}
              onMouseLeave={() => setHoveredTray(null)}
              className="group relative block aspect-[4/3] overflow-hidden rounded-3xl shadow-soft"
            >
              <img
                src={tray.image}
                alt={tray.name}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <h3 className="font-display text-2xl text-background">{tray.name}</h3>
                <p className="mt-1 text-sm text-background/80 line-clamp-2">{tray.desc}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      add(tray.foodId);
                    }}
                    aria-label={`${t("card.add")} ${tray.name}`}
                    className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-warm hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </Link>
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
          {popular.map((f) => {
            const l = localizedFood(f, locale);
            return (
              <Link
                key={f.id}
                to="/food/$id"
                params={{ id: f.id }}
                className="group relative block aspect-square overflow-hidden rounded-3xl shadow-soft"
              >
                <img
                  src={f.image}
                  alt={l.name}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <h3 className="font-display text-xl text-background">{l.name}</h3>
                  <p className="mt-1 text-xs text-background/80 line-clamp-1">{l.tagline}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-lg text-background">${f.price}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        add(f.id);
                      }}
                      aria-label={`${t("card.add")} ${l.name}`}
                      className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-warm hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
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
