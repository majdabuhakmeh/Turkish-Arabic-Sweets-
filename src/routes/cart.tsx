import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin, AlertCircle } from "lucide-react";
import { useCart } from "@/context/cart";
import { useI18n, useT } from "@/context/i18n";
import { localizedFood } from "@/lib/foods";
import { formatPrice } from "@/lib/currency";
import { useBranch } from "@/context/branch";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — Royal Sweets" }] }),
  component: CartPage,
});

function CartPage() {
  const { detailed, setQty, remove, subtotal, count, hasUnavailable } = useCart();
  const t = useT();
  const { locale } = useI18n();
  const { selected } = useBranch();
  const delivery = subtotal > 0 ? Number(selected?.delivery_fee ?? 0) : 0;
  const minOrder = Number(selected?.min_order ?? 0);
  const belowMin = minOrder > 0 && subtotal > 0 && subtotal < minOrder;
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;

  if (count === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <div className="size-20 rounded-full bg-card border border-border grid place-items-center mx-auto">
          <ShoppingBag className="size-8 text-muted-foreground" />
        </div>
        <h1 className="mt-8 font-display text-5xl">{t("cart.emptyTitle")}</h1>
        <p className="mt-4 text-muted-foreground">
          {t("cart.emptyBody")}
        </p>
        <Link
          to="/menu"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 h-12 text-sm font-medium hover:bg-primary/90"
        >
          {t("cart.browse")} <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-6xl">{t("cart.title")}</h1>
      <p className="mt-2 text-muted-foreground">{count} {t("cart.itemsReady")}</p>

      {selected && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
          <MapPin className="size-4 text-primary" />
          <span className="text-muted-foreground">Fulfilled by</span>
          <span className="font-medium">{selected.name}</span>
          {selected.eta_minutes && (
            <span className="text-muted-foreground">· ~{selected.eta_minutes} min</span>
          )}
        </div>
      )}

      {hasUnavailable && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <p>
            Some items aren&rsquo;t available at <strong>{selected?.name ?? "this branch"}</strong>. Remove them or switch branches to continue.
          </p>
        </div>
      )}

      {belowMin && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            {selected?.name} has a minimum order of <strong>{formatPrice(minOrder, locale)}</strong>. Add
            <strong> {formatPrice(minOrder - subtotal, locale)} </strong>more to check out.
          </p>
        </div>
      )}

      <div className="mt-12 grid lg:grid-cols-3 gap-12">
        <ul className="lg:col-span-2 divide-y divide-border">
          {detailed.map(({ food, qty, lineTotal, unitPrice, available }) => {
            const l = localizedFood(food, locale);
            return (
            <li key={food.id} className={`py-6 flex gap-5 ${available ? "" : "opacity-60"}`}>
              <Link
                to="/food/$id"
                params={{ id: food.id }}
                className="size-28 shrink-0 rounded-2xl overflow-hidden"
              >
                <img
                  src={food.image}
                  alt={l.name}
                  width={200}
                  height={200}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl leading-tight">{l.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{l.tagline}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPrice(unitPrice, locale)} each</p>
                    {!available && (
                      <p className="text-xs text-destructive mt-1 font-medium">
                        Unavailable at this branch
                      </p>
                    )}
                  </div>
                  <div className="font-display text-xl text-primary">
                    {formatPrice(lineTotal, locale)}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-border bg-card h-10">
                    <button
                      onClick={() => setQty(food.id, qty - 1)}
                      className="size-10 grid place-items-center hover:text-primary"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <button
                      onClick={() => setQty(food.id, qty + 1)}
                      className="size-10 grid place-items-center hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(food.id)}
                    className="text-sm text-muted-foreground hover:text-destructive inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="size-4" /> {t("cart.remove")}
                  </button>
                </div>
              </div>
            </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-28 self-start rounded-3xl bg-card border border-border p-8 shadow-soft">
          <h2 className="font-display text-3xl">{t("cart.summary")}</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd className="font-medium">{formatPrice(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.delivery")}</dt>
              <dd className="font-medium">{formatPrice(delivery, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.tax")}</dt>
              <dd className="font-medium">{formatPrice(tax, locale)}</dd>
            </div>
            <div className="border-t border-border pt-4 flex justify-between items-baseline">
              <dt className="font-display text-xl">{t("cart.total")}</dt>
              <dd className="font-display text-3xl text-primary">{formatPrice(total, locale)}</dd>
            </div>
          </dl>
          {hasUnavailable || belowMin ? (
            <button
              disabled
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-muted text-muted-foreground h-14 font-medium cursor-not-allowed"
            >
              {hasUnavailable ? "Resolve unavailable items" : `Add ${formatPrice(minOrder - subtotal, locale)} to check out`}
            </button>
          ) : (
            <Link
              to="/checkout"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground h-14 font-medium shadow-warm hover:bg-primary/90 transition-colors"
            >
              {t("cart.checkout")} <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          )}
          <Link
            to="/menu"
            className="mt-3 w-full inline-flex items-center justify-center h-12 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("cart.addMore")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
