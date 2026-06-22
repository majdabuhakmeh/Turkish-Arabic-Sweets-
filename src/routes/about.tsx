import { createFileRoute } from "@tanstack/react-router";
import heroAsset from "@/assets/sweet-tray-assortment.jpg.asset.json";
import storyAsset from "@/assets/sweet-baklava-tray.jpg.asset.json";

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
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-primary">Our story</span>
        <h1 className="mt-4 font-display text-6xl lg:text-8xl leading-[0.95] text-balance">
          A family kitchen, <em className="text-primary not-italic">centuries</em> of taste.
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          Royal Sweets began in a small kitchen in Al-Sumou, with one mission:
          to honor the Levantine art of confectionery — every sheet of phyllo
          rolled by hand, every nut hand-cracked, every tray scented with rose
          water and orange blossom the way our grandmothers taught us.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-warm">
          <img src={heroAsset.url} alt="A presentation tray of Royal Sweets" className="size-full object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-24 space-y-8 text-lg leading-relaxed text-foreground/85">
        <p>
          We believe the finest sweets come from the simplest ingredients, treated
          with absurd attention. The clearest clarified butter. Whole Aleppo
          pistachios. Akkawi cheese desalinated overnight. A syrup that sings
          of orange blossom, not sugar.
        </p>
        <div className="aspect-[4/3] my-12 rounded-[2rem] overflow-hidden shadow-soft">
          <img src={storyAsset.url} alt="Fresh baklava on the tray" className="size-full object-cover" />
        </div>
        <p>
          Every piece you receive was rolled, layered and baked the same day. We
          deliver fresh from the boutique on Al-Sumou Center — and every gift
          box leaves with our crown seal.
        </p>
        <p className="font-display text-3xl text-primary not-italic">
          Come hungry. Leave like royalty.
        </p>
      </section>
    </div>
  );
}
