import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  Menu as MenuIcon,
  User as UserIcon,
  Shield,
  Languages,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { useI18n, useT } from "@/context/i18n";
import { getIsAdmin } from "@/lib/admin.functions";
import { RoyalLogo } from "@/components/RoyalLogo";
import { BranchSwitcher } from "@/components/BranchSwitcher";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/menu", key: "nav.menu" },
  { to: "/r", key: "nav.brands" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const { locale, setLocale, dir } = useI18n();
  const t = useT();
  const [open, setOpen] = useState(false);
  const checkAdmin = useServerFn(getIsAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin", user?.id ?? "none"],
    queryFn: () => checkAdmin(),
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-11 rounded-full bg-foreground grid place-items-center text-primary shadow-soft">
            <RoyalLogo size={26} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-2xl tracking-tight">
              {locale === "ar" ? "حلويات الملكي" : "Royal Sweets"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary -mt-0.5">
              {locale === "ar" ? "السموع" : "Al-Sumou"}
            </div>
          </div>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="relative size-11 grid place-items-center rounded-full border border-border hover:border-foreground transition-colors"
          aria-label={t("nav.menuLabel")}
        >
          <MenuIcon className="size-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold grid place-items-center">
              {count}
            </span>
          )}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={dir === "rtl" ? "left" : "right"} className="flex flex-col gap-0 p-0">
          <SheetTitle className="sr-only">{t("nav.menuLabel")}</SheetTitle>
          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
            <nav className="flex flex-col gap-1">
              {links
                .filter((l) => l.key !== "nav.brands") // hidden temporarily, remove filter to bring back
                .map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="py-2.5 text-lg font-display"
                    activeProps={{ className: "text-primary" }}
                    activeOptions={{ exact: l.to === "/" }}
                  >
                    {t(l.key)}
                  </Link>
                ))}
            </nav>

            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 h-12 text-sm font-medium hover:bg-primary transition-colors"
            >
              <ShoppingBag className="size-4" />
              {t("nav.cart")}
              {count > 0 && <span className="ml-1">({count})</span>}
            </Link>

            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
                  >
                    <UserIcon className="size-4" /> {t("nav.account")}
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
                  >
                    <Heart className="size-4" /> {t("nav.favorites")}
                  </Link>
                  {adminData?.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
                    >
                      <Shield className="size-4" /> {t("nav.admin")}
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signin" }}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
                >
                  {t("nav.signin")}
                </Link>
              )}
              <BranchSwitcher />
              <button
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 h-11 text-sm hover:border-foreground transition-colors"
                aria-label="Switch language"
              >
                <Languages className="size-4" />
                <span>{t("lang.switch")}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
