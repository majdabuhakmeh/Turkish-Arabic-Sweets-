import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Btn = readOnly ? "span" : "button";
        return (
          <Btn
            key={n}
            {...(!readOnly && {
              type: "button" as const,
              onClick: () => onChange?.(n),
              "aria-label": `${n} star${n > 1 ? "s" : ""}`,
            })}
            className={readOnly ? "" : "cursor-pointer transition-transform hover:scale-110"}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-secondary text-secondary" : "text-muted-foreground/40"}
            />
          </Btn>
        );
      })}
    </div>
  );
}