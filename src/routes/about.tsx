import { createFileRoute } from "@tanstack/react-router";
import heroAsset from "@/assets/sweet-tray-assortment.jpg.asset.json";
import storyAsset from "@/assets/sweet-baklava-tray.jpg.asset.json";
import { useT } from "@/context/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Royal Sweets" },
      { name: "description", content: "Royal Sweets (حلويات الملكي) is a family confectionery in Al-Sumou crafting Levantine baklava, kunafa and pastries by hand every day." },
      { property: "og:title", content: "Our Story — Royal Sweets" },
      { property: "og:description", content: "A family confectionery in Al-Sumou crafting Levantine sweets by hand every day." },
      { property: "og:image", content: heroAsset.url },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const t = useT();
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-primary">{t("about.kicker")}</span>
        <h1 className="mt-4 font-display text-6xl lg:text-8xl leading-[0.95] text-balance">
          {t("about.titleA")} <em className="text-primary not-italic">{t("about.titleEm")}</em> {t("about.titleB")}
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          {t("about.intro")}
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-warm">
          <img src={heroAsset.url} alt={t("about.imageAlt1")} className="size-full object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-24 space-y-8 text-lg leading-relaxed text-foreground/85">
        <p>{t("about.body1")}</p>
        <div className="aspect-[4/3] my-12 rounded-[2rem] overflow-hidden shadow-soft">
          <img src={storyAsset.url} alt={t("about.imageAlt2")} className="size-full object-cover" />
        </div>
        <p>{t("about.body2")}</p>
        <p className="font-display text-3xl text-primary not-italic">
          {t("about.closing")}
        </p>
      </section>
    </div>
  );
}
