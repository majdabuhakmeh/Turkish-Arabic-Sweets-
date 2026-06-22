import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Visit Us — Royal Sweets" },
      { name: "description", content: "Visit, call or message Royal Sweets at Al-Sumou Center. Open daily 9am – 11pm." },
      { property: "og:title", content: "Visit Us — Royal Sweets" },
      { property: "og:description", content: "Al-Sumou Center · Open daily 9am – 11pm · 0598 356 306" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-primary">Visit the boutique</span>
      <h1 className="mt-4 font-display text-6xl lg:text-7xl">Come say hello.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Stop by the Royal Sweets boutique at Al-Sumou Center for a warm slice of
        kunafa straight from the oven, or message us to arrange a gift box.
      </p>

      <div className="mt-16 grid lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          {[
            { icon: MapPin, title: "Visit", body: "Al-Sumou Center, Asfi\nAl-Sumou" },
            { icon: Phone, title: "Call / WhatsApp", body: "0598 356 306" },
            { icon: Mail, title: "Email", body: "hello@royalsweets.com" },
            { icon: Clock, title: "Hours", body: "Open daily, 9am – 11pm" },
          ].map((b) => (
            <div key={b.title} className="flex gap-4">
              <div className="size-12 shrink-0 rounded-full bg-primary/15 grid place-items-center">
                <b.icon className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl">{b.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line mt-1">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        <form className="rounded-3xl bg-card border border-border p-8 shadow-soft space-y-4">
          <h2 className="font-display text-3xl">Send a note</h2>
          <input placeholder="Your name" className="w-full h-12 rounded-2xl bg-background border border-border px-4 focus:outline-none focus:border-primary" />
          <input type="email" placeholder="Email" className="w-full h-12 rounded-2xl bg-background border border-border px-4 focus:outline-none focus:border-primary" />
          <textarea rows={5} placeholder="What gift box can we prepare for you?" className="w-full rounded-2xl bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary" />
          <button type="button" className="w-full rounded-full gradient-warm text-primary-foreground h-12 font-medium hover:opacity-95 transition-opacity">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
