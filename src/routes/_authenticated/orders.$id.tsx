import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Circle, Star, Clock, ChefHat, Bike, PackageCheck, ShoppingBag } from "lucide-react";
import { ReviewDialog } from "@/components/ReviewDialog";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_notes: string | null;
  created_at: string;
  estimated_delivery_at: string | null;
};
type Item = {
  id: string;
  food_id: string;
  name: string;
  image_url: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
};
type StatusEvent = { id: string; status: string; created_at: string };

const steps = [
  { key: "placed", label: "Order placed", desc: "We received your order", Icon: ShoppingBag },
  { key: "preparing", label: "Preparing", desc: "The kitchen is cooking", Icon: ChefHat },
  { key: "on_the_way", label: "On the way", desc: "Your rider is heading over", Icon: Bike },
  { key: "delivered", label: "Delivered", desc: "Enjoy your meal!", Icon: PackageCheck },
] as const;

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Royal Sweets" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Item | null>(null);
  const [reviewedFoodIds, setReviewedFoodIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("food_id")
      .eq("order_id", id)
      .then(({ data }) => {
        setReviewedFoodIds(new Set((data ?? []).map((r) => r.food_id as string)));
      });
  }, [id]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ data: o }, { data: it }, { data: ev }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
        supabase
          .from("order_status_events")
          .select("id, status, created_at")
          .eq("order_id", id)
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setOrder((o as Order) ?? null);
      setItems((it as Item[]) ?? []);
      setEvents((ev as StatusEvent[]) ?? []);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => setOrder(payload.new as Order),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_events", filter: `order_id=eq.${id}` },
        (payload) =>
          setEvents((prev) => {
            const next = payload.new as StatusEvent;
            if (prev.some((e) => e.id === next.id)) return prev;
            return [...prev, next];
          }),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <Link to="/orders" className="mt-6 inline-block text-primary">Back to orders</Link>
      </div>
    );
  }

  const currentIdx = Math.max(0, steps.findIndex((s) => s.key === order.status));
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const eta = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : null;
  const minutesLeft = eta ? Math.round((eta - now) / 60000) : null;
  const timeForStep = (key: string) => events.find((e) => e.status === key)?.created_at ?? null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>
      <h1 className="mt-4 font-display text-5xl">Order #{order.id.slice(0, 8)}</h1>
      <p className="mt-2 text-muted-foreground">
        {new Date(order.created_at).toLocaleString()}
      </p>

      {cancelled ? (
        <div className="mt-10 rounded-2xl bg-destructive/10 text-destructive p-6 font-medium">
          This order was cancelled.
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-border bg-card p-8">
          {/* ETA banner */}
          <div className="flex items-center gap-4 rounded-2xl bg-primary/10 p-5">
            <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
              {delivered ? <PackageCheck className="size-6" /> : <Clock className="size-6" />}
            </div>
            <div>
              {delivered ? (
                <>
                  <div className="font-display text-xl">Delivered</div>
                  <div className="text-sm text-muted-foreground">
                    {timeForStep("delivered")
                      ? `Arrived at ${new Date(timeForStep("delivered")!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "Your order has arrived"}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-display text-xl">
                    {minutesLeft !== null && minutesLeft > 0
                      ? `Arriving in ~${minutesLeft} min`
                      : "Arriving any moment"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {eta
                      ? `Estimated delivery by ${new Date(eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "Estimating delivery time…"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vertical timeline */}
          <ol className="mt-8 space-y-0">
            {steps.map((s, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx && !delivered;
              const ts = timeForStep(s.key);
              const last = i === steps.length - 1;
              const StepIcon = s.Icon;
              return (
                <li key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`grid size-10 place-items-center rounded-full border-2 transition-colors ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground/50"
                      } ${active ? "ring-4 ring-primary/20" : ""}`}
                    >
                      {done ? (
                        active ? <StepIcon className="size-5" /> : <CheckCircle2 className="size-5" />
                      ) : (
                        <Circle className="size-5" />
                      )}
                    </div>
                    {!last && (
                      <div className={`w-0.5 flex-1 min-h-10 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className={`pb-8 ${last ? "pb-0" : ""}`}>
                    <div className={`font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                      {active && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                          In progress
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{s.desc}</div>
                    {ts && (
                      <div className="mt-1 text-xs text-muted-foreground/80">
                        {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-display text-2xl">Items</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {items.map((it) => (
              <li key={it.id} className="p-4 flex items-center gap-4">
                {it.image_url && (
                  <img src={it.image_url} alt="" className="size-14 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {Number(it.unit_price).toFixed(2)} NIS × {it.qty}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-medium">{Number(it.line_total).toFixed(2)} NIS</div>
                  {order.status === "delivered" && (
                    <Button
                      size="sm"
                      variant={reviewedFoodIds.has(it.food_id) ? "outline" : "secondary"}
                      onClick={() => setReviewing(it)}
                    >
                      <Star className="size-3.5" />
                      {reviewedFoodIds.has(it.food_id) ? "Edit review" : "Review"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-xl">Summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={order.subtotal} />
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                  <dd className="font-medium">−{Number(order.discount).toFixed(2)} NIS</dd>
                </div>
              )}
              <Row label="Delivery" value={order.delivery_fee} />
              <Row label="Tax" value={order.tax} />
              <div className="flex justify-between pt-3 border-t border-border">
                <dt className="font-display text-lg">Total</dt>
                <dd className="font-display text-2xl text-primary">{Number(order.total).toFixed(2)} NIS</dd>
              </div>
            </dl>
            <div className="mt-3 text-xs text-muted-foreground capitalize">
              Paid by {order.payment_method}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm">
            <h3 className="font-display text-xl">Delivery</h3>
            <div className="mt-3 space-y-1">
              <div className="font-medium">{order.delivery_name}</div>
              <div className="text-muted-foreground">{order.delivery_phone}</div>
              <div>{order.delivery_address}</div>
              <div>{order.delivery_city}</div>
              {order.delivery_notes && (
                <div className="text-muted-foreground italic mt-2">"{order.delivery_notes}"</div>
              )}
            </div>
          </div>
        </aside>
      </div>
      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          onOpenChange={(o) => !o && setReviewing(null)}
          foodId={reviewing.food_id}
          foodName={reviewing.name}
          orderId={order.id}
          onSaved={() =>
            setReviewedFoodIds((prev) => new Set(prev).add(reviewing.food_id))
          }
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{Number(value).toFixed(2)} NIS</dd>
    </div>
  );
}