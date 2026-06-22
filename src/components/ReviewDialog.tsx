import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { useT } from "@/context/i18n";

export function ReviewDialog({
  open,
  onOpenChange,
  foodId,
  foodName,
  orderId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  foodId: string;
  foodName: string;
  orderId: string;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("reviews")
      .select("id,rating,comment")
      .eq("food_id", foodId)
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setRating(data.rating);
          setComment(data.comment ?? "");
        } else {
          setExistingId(null);
          setRating(5);
          setComment("");
        }
      });
  }, [open, user, foodId, orderId]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      food_id: foodId,
      order_id: orderId,
      rating,
      comment: comment.trim().slice(0, 1000),
    };
    const { error } = existingId
      ? await supabase.from("reviews").update(payload).eq("id", existingId)
      : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("reviews.saved"));
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {t("reviews.rate")} {foodName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("reviews.yourRating")}
            </div>
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("reviews.yourComment")}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviews.placeholder")}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("reviews.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving || rating < 1}>
            {existingId ? t("reviews.update") : t("reviews.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}