import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu as MenuIcon, X, User as UserIcon, Shield, Languages, Heart } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { useI18n, useT } from "@/context/i18n";
import { getIsAdmin } from "@/lib/admin.functions";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/menu", key: "nav.menu" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const { locale, setLocale } = useI18n();
  const t = useT();
  const [open, setOpen] = useState(false);
  const checkAdmin = useServerFn(getIsAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin", user?.id ?? "none"],
    queryFn: () => checkAdmin(),
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-9 rounded-full gradient-warm grid place-items-center text-primary-foreground font-display text-lg">
            S
          </div>
          <div className="leading-tight">
            <div className="font-display text-2xl">{locale === "ar" ? "زعفران" : "Saffron"}</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground -mt-1">
              {locale === "ar" ? "مطبخ" : "Kitchen"}
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm tracking-wide text-foreground/80 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-3 h-11 text-sm hover:border-foreground transition-colors"
            aria-label="Switch language"
          >
            <Languages className="size-4" />
            <span>{t("lang.switch")}</span>
          </button>
          {adminData?.isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
            >
              <Shield className="size-4" /> {t("nav.admin")}
            </Link>
          )}
          {user ? (
            <>
            <Link
              to="/favorites"
              className="hidden sm:inline-flex items-center justify-center size-11 rounded-full border border-border hover:border-foreground transition-colors"
              aria-label={t("nav.favorites")}
            >
              <Heart className="size-4" />
            </Link>
            <Link
              to="/account"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
            >
              <UserIcon className="size-4" /> {t("nav.account")}
            </Link>
            </>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="hidden sm:inline-flex items-center rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
            >
              {t("nav.signin")}
            </Link>
          )}
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 h-11 text-sm font-medium hover:bg-primary transition-colors"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">{t("nav.cart")}</span>
            {count > 0 && (
              <span className="absolute -top-1 -rtl:-left-1 -right-1 size-5 rounded-full bg-secondary text-charcoal text-[11px] font-semibold grid place-items-center">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden size-11 grid place-items-center rounded-full border border-border"
            aria-label={t("nav.menuLabel")}
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 text-base"
              >
                {t(l.key)}
              </Link>
            ))}
            <button
              onClick={() => {
                setLocale(locale === "ar" ? "en" : "ar");
                setOpen(false);
              }}
              className="py-2 text-base text-left inline-flex items-center gap-2"
            >
              <Languages className="size-4" /> {t("lang.switch")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
