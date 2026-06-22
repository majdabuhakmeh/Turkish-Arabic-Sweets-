import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Royal Sweets" },
      { name: "description", content: "Visit, call or email Royal Sweets. We're open daily 11am to 11pm." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-primary">Get in touch</span>
      <h1 className="mt-4 font-display text-6xl lg:text-7xl">Come say hi.</h1>

      <div className="mt-16 grid lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          {[
            { icon: MapPin, title: "Visit", body: "221 Oak Street\nSan Francisco, CA 94102" },
            { icon: Phone, title: "Call", body: "+1 (415) 555-0142" },
            { icon: Mail, title: "Email", body: "hello@royalsweets.com" },
            { icon: Clock, title: "Hours", body: "Open daily, 11am – 11pm" },
          ].map((b) => (
            <div key={b.title} className="flex gap-4">
              <div className="size-12 shrink-0 rounded-full bg-primary/10 grid place-items-center">
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
          <textarea rows={5} placeholder="What's on your mind?" className="w-full rounded-2xl bg-background border border-border px-4 py-3 focus:outline-none focus:border-primary" />
          <button type="button" className="w-full rounded-full bg-primary text-primary-foreground h-12 font-medium hover:bg-primary/90 transition-colors">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
