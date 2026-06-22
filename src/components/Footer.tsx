import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { useT } from "@/context/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-32 border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-20 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <div className="font-display text-4xl mb-4">{t("footer.brand")}</div>
          <p className="text-background/70 leading-relaxed">
            {t("footer.about")}
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="size-10 rounded-full border border-background/20 grid place-items-center hover:bg-primary hover:border-primary transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-xl mb-4">{t("footer.visit")}</h4>
          <p className="text-background/70 text-sm leading-relaxed">
            {t("footer.address")}
            <br />
            {t("footer.hours")}
            <br />
            {t("footer.phone")}
          </p>
        </div>
        <div>
          <h4 className="font-display text-xl mb-4">{t("footer.explore")}</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link to="/menu">{t("nav.menu")}</Link></li>
            <li><Link to="/about">{t("nav.about")}</Link></li>
            <li><Link to="/contact">{t("nav.contact")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 py-6 text-center text-xs text-background/50">
        © {new Date().getFullYear()} {t("footer.brand")}. {t("footer.copyright")}
      </div>
    </footer>
  );
}
