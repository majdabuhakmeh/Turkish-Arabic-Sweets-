import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useI18n, useT } from "@/context/i18n";

const STORAGE_KEY = "royalsweets.promoDismissed";

export function PromoToast() {
  const [visible, setVisible] = useState(false);
  const t = useT();
  const { dir } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode) — dismissal just won't persist
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 max-w-sm animate-promo-in rounded-2xl border border-[var(--gold)] bg-[var(--charcoal)] p-5 shadow-luxe"
      style={{ ["--promo-from-x" as string]: dir === "rtl" ? "-32px" : "32px" }}
      role="status"
    >
      <button
        onClick={dismiss}
        aria-label={t("promo.close")}
        className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-[var(--cream)]/60 hover:text-[var(--cream)] transition-colors"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-5 rtl:pr-0 rtl:pl-5">
        <span className="mt-1.5 size-2 shrink-0 rotate-45 bg-[var(--gold)]" />
        <p className="text-sm leading-relaxed text-[var(--cream)]">{t("promo.title")}</p>
      </div>
      <Link
        to="/menu"
        onClick={dismiss}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--gold)] text-[var(--charcoal)] h-11 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t("promo.cta")}
      </Link>
    </div>
  );
}
