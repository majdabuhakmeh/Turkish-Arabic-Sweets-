import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Wallet, Loader2, Tag, X, Check, AlertCircle, Clock } from "lucide-react";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/branch";
import { useServerFn } from "@tanstack/react-start";
import { placeOrder } from "@/lib/orders.functions";
import { validateCoupon, previewCoupon, type CouponPreview } from "@/lib/coupons.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Royal Sweets" }] }),
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { mode: "signin", redirect: location.href } });
    }
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { subtotal, count, detailed, clear } = useCart();
  const { user } = useAuth();
  const { selected: branch } = useBranch();
  const navigate = useNavigate();
  const place = useServerFn(placeOrder);
  const checkCoupon = useServerFn(validateCoupon);
  const lookupCoupon = useServerFn(previewCoupon);

  const [pay, setPay] = useState<"card" | "cash">("card");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState<{ code: string; discount: number } | null>(null);

  const delivery = 3.5;
  const taxRate = 0.08;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const discounted = Math.max(0, subtotal - discount);
  const tax = discounted * taxRate;
  const total = discounted + delivery + tax;

  // Live preview of a typed code (eligibility + discount impact) before applying.
  useEffect(() => {
    if (coupon) {
      setPreview(null);
      return;
    }
    const c = code.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (c.length < 2) {
      setPreview(null);
      setPreviewing(false);
      return;
    }
    setPreviewing(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await lookupCoupon({ data: { code: c, subtotal } });
        setPreview(res);
      } catch {
        setPreview(null);
      } finally {
        setPreviewing(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, subtotal, coupon, lookupCoupon]);

  const applyCoupon = async () => {
    const c = code.trim();
    if (!c) return;
    setApplying(true);
    try {
      const res = await checkCoupon({ data: { code: c, subtotal } });
      if (!res.valid) {
        setCoupon(null);
        toast.error(res.message);
        return;
      }
      // Re-validated server-side — surface a confirmation step before committing.
      setPending({ code: res.code, discount: res.discount });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply code");
    } finally {
      setApplying(false);
    }
  };

  const confirmCoupon = () => {
    if (!pending) return;
    setCoupon(pending);
    toast.success(`${pending.code} applied — you saved $${pending.discount.toFixed(2)}`);
    setPending(null);
    setPreview(null);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCode("");
    setPreview(null);
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, default_address")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.full_name) setName(data.full_name);
        if (data.phone) setPhone(data.phone);
        if (data.default_address) setAddress(data.default_address);
      });
  }, [user]);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl">Your bag is empty.</h1>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await place({
        data: {
          items: detailed.map((d) => ({
            food_id: d.food.id,
            name: d.food.name,
            image_url: d.food.image,
            unit_price: d.food.price,
            qty: d.qty,
          })),
          delivery: { name, phone, address, city, notes: notes || undefined },
          payment_method: pay,
          delivery_fee: delivery,
          tax_rate: taxRate,
          coupon_code: coupon?.code,
        },
      });
      clear();
      toast.success("Order placed!");
      navigate({ to: "/orders/$id", params: { id: res.id } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-6xl">Checkout</h1>
      <form onSubmit={submit} className="mt-12 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-medium">1</span>
              <h2 className="font-display text-3xl">Delivery details</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" value={name} onChange={setName} required />
              <Field label="Phone" type="tel" value={phone} onChange={setPhone} required />
              <Field label="Street address" value={address} onChange={setAddress} required className="sm:col-span-2" />
              <Field label="City" value={city} onChange={setCity} required />
              <textarea
                placeholder="Delivery notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="sm:col-span-2 rounded-2xl bg-card border border-border px-5 py-4 focus:outline-none focus:border-primary"
              />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-medium">2</span>
              <h2 className="font-display text-3xl">Payment</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <PayOption active={pay === "card"} onClick={() => setPay("card")} icon={CreditCard} label="Credit card" sub="Visa, Mastercard, Amex" />
              <PayOption active={pay === "cash"} onClick={() => setPay("cash")} icon={Wallet} label="Cash on delivery" sub="Pay when it arrives" />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 self-start rounded-3xl bg-card border border-border p-8 shadow-warm">
          <h2 className="font-display text-3xl">Your order</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Subtotal" value={subtotal} />
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <dt>Discount ({coupon?.code})</dt>
                <dd className="font-medium">−${discount.toFixed(2)}</dd>
              </div>
            )}
            <Row label="Delivery" value={delivery} />
            <Row label="Tax" value={tax} />
            <div className="border-t border-border pt-4 flex justify-between items-baseline">
              <dt className="font-display text-xl">Total</dt>
              <dd className="font-display text-3xl text-primary">${total.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border pt-6">
            {coupon ? (
              <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" />
                  <span className="font-medium">{coupon.code}</span>
                  <span className="text-muted-foreground">applied</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove promo code"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder="Promo code"
                    className="w-full h-11 rounded-2xl bg-card border border-border pl-9 pr-3 text-sm uppercase tracking-wide focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applying || !code.trim()}
                  className="rounded-2xl border border-border px-4 h-11 text-sm font-medium hover:border-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {applying && <Loader2 className="size-4 animate-spin" />}
                  Apply
                </button>
              </div>
            )}

            {!coupon && (previewing || preview) && (
              <CouponPreviewCard
                loading={previewing}
                preview={preview}
                onApply={applyCoupon}
                applying={applying}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-primary text-primary-foreground h-14 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Place order · ${total.toFixed(2)}
          </button>
        </aside>
      </form>

      {pending && (
        <CouponConfirmDialog
          pending={pending}
          subtotal={subtotal}
          delivery={delivery}
          taxRate={taxRate}
          onConfirm={confirmCoupon}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        type={type} required={required}
        className="mt-2 w-full h-12 rounded-2xl bg-card border border-border px-4 focus:outline-none focus:border-primary transition-colors"
      />
    </label>
  );
}

function PayOption({
  active, onClick, icon: Icon, label, sub,
}: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string; sub: string;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground"
      }`}
    >
      <Icon className="size-5 text-primary" />
      <div className="mt-3 font-medium">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </button>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">${value.toFixed(2)}</dd>
    </div>
  );
}

function CouponPreviewCard({
  loading,
  preview,
  onApply,
  applying,
}: {
  loading: boolean;
  preview: CouponPreview | null;
  onApply: () => void;
  applying: boolean;
}) {
  if (loading && !preview) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking code…
      </div>
    );
  }
  if (!preview) return null;

  if (!preview.found) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="size-4 mt-0.5 shrink-0" />
        <span>{preview.message}</span>
      </div>
    );
  }

  const eligible = preview.eligible;
  const offerLabel =
    preview.discount_type === "percent"
      ? `${preview.discount_value}% off`
      : `$${(preview.discount_value ?? 0).toFixed(2)} off`;
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      className={`mt-3 rounded-2xl border p-4 ${
        eligible ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium tracking-wide">{preview.code}</span>
            <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">
              {offerLabel}
            </span>
          </div>
          {preview.description && (
            <p className="mt-1 text-xs text-muted-foreground">{preview.description}</p>
          )}
        </div>
        {eligible && (
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">You save</div>
            <div className="font-display text-xl text-primary leading-none">
              −${preview.discount.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {preview.min_subtotal ? (
          <li className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary" />
            Minimum order ${preview.min_subtotal.toFixed(2)}
          </li>
        ) : null}
        {preview.discount_type === "percent" && preview.max_discount ? (
          <li className="flex items-center gap-1.5">
            <Check className="size-3.5 text-primary" />
            Up to ${preview.max_discount.toFixed(2)} off
          </li>
        ) : null}
        {preview.expires_at ? (
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Valid until {fmtDate(preview.expires_at)}
          </li>
        ) : null}
        {preview.usage_limit != null ? (
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {Math.max(0, preview.usage_limit - (preview.used_count ?? 0))} use
            {preview.usage_limit - (preview.used_count ?? 0) === 1 ? "" : "s"} left
          </li>
        ) : null}
      </ul>

      {eligible ? (
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="mt-3 w-full rounded-full bg-primary text-primary-foreground h-10 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {applying && <Loader2 className="size-4 animate-spin" />}
          Apply this code
        </button>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>{preview.message}</span>
        </div>
      )}
    </div>
  );
}

function CouponConfirmDialog({
  pending,
  subtotal,
  delivery,
  taxRate,
  onConfirm,
  onCancel,
}: {
  pending: { code: string; discount: number };
  subtotal: number;
  delivery: number;
  taxRate: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const discount = Math.min(pending.discount, subtotal);
  const discounted = Math.max(0, subtotal - discount);
  const tax = discounted * taxRate;
  const newTotal = discounted + delivery + tax;
  const oldTotal = subtotal + delivery + subtotal * taxRate;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-warm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-primary">
          <Check className="size-5" />
          <span className="text-sm font-medium tracking-wide">Code re-validated</span>
        </div>
        <h2 className="mt-2 font-display text-3xl">Apply {pending.code}?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm to apply this discount to your order.
        </p>

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Subtotal" value={subtotal} />
          <div className="flex justify-between text-primary">
            <dt>Discount ({pending.code})</dt>
            <dd className="font-medium">−${discount.toFixed(2)}</dd>
          </div>
          <Row label="Delivery" value={delivery} />
          <Row label="Tax" value={tax} />
          <div className="border-t border-border pt-4 flex justify-between items-baseline">
            <dt className="font-display text-xl">New total</dt>
            <dd className="text-right">
              <span className="block text-xs text-muted-foreground line-through">
                ${oldTotal.toFixed(2)}
              </span>
              <span className="font-display text-3xl text-primary">${newTotal.toFixed(2)}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/30 px-4 py-3 text-sm text-center">
          You save <span className="font-medium text-primary">${discount.toFixed(2)}</span> on this order
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border h-12 text-sm font-medium hover:border-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-primary text-primary-foreground h-12 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Confirm &amp; apply
          </button>
        </div>
      </div>
    </div>
  );
}