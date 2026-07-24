import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useT } from "@/context/i18n";

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
  const t = useT();
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-primary">{t("contact.kicker")}</span>
      <h1 className="mt-4 font-display text-6xl lg:text-7xl">{t("contact.title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {t("contact.intro")}
      </p>

      <div className="mt-16 grid lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          {[
            { icon: MapPin, title: t("contact.visit"), body: t("contact.visitBody") },
            { icon: Phone, title: t("contact.call"), body: "0598 356 306" },
            { icon: Mail, title: t("contact.email"), body: "hello@royalsweets.com" },
            { icon: Clock, title: t("contact.hours"), body: t("contact.hoursBody") },
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
          <h2 className="font-display text-3xl">{t("contact.formTitle")}</h2>
          <input placeholder={t("contact.formName")} className="w-full h-12 rounded-2xl bg-background border border-border px-4 focus:outline-none focus:border-primary" />
          <input type="email" placeholder={t("contact.formEmail")} className="w-full h-12 rounded-2xl bg-background border border-border px-4 focus:outline-none focus:border-primary" />
          <textarea rows={5} placeholder={t("contact.formMessage")} className="w-full rounded-2xl bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary" />
          <button type="button" className="w-full rounded-full gradient-warm text-primary-foreground h-12 font-medium hover:opacity-95 transition-opacity">
            {t("contact.formSend")}
          </button>
        </form>
      </div>
    </div>
  );
}
