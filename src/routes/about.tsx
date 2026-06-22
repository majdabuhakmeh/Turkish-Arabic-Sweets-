import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Royal Sweets" },
      { name: "description", content: "Royal Sweets is a neighborhood restaurant obsessed with wood-fired flavor, hand-cut pasta, and produce from local growers." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-primary">Our story</span>
        <h1 className="mt-4 font-display text-6xl lg:text-8xl leading-[0.95] text-balance">
          A small kitchen with <em className="text-primary not-italic">big fire.</em>
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
          Saffron started as a Sunday supper club in a 400 sq ft garage. Five years later
          we serve thousands of plates a week — but we still cold-ferment every dough for
          72 hours and break down every chicken by hand.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-warm">
          <img src={heroImg} alt="Inside the Royal Sweets" className="size-full object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-24 space-y-8 text-lg leading-relaxed text-foreground/85">
        <p>
          We believe the best meals come from the simplest ideas executed with absurd
          attention. A perfect tomato. A 900-degree oven. Salt at the right moment.
        </p>
        <p>
          Every ingredient is sourced within 50 miles when we can — our flour from a
          family mill in Sonoma, our mozzarella made fresh each morning two blocks away,
          our greens from a rooftop farm we helped build.
        </p>
        <p className="font-display text-3xl text-primary not-italic">
          Come hungry. Stay curious.
        </p>
      </section>
    </div>
  );
}
