import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadAsset } from "@/lib/vendor.functions";

type Folder = "logos" | "covers" | "foods" | "categories" | "branches";

export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  aspect = "square",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  folder: Folder;
  label?: string;
  aspect?: "square" | "wide" | "tall";
}) {
  const upload = useServerFn(uploadAsset);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await upload({
        data: {
          folder,
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64,
        },
      });
      onChange(res.url);
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const aspectCls =
    aspect === "wide" ? "aspect-[3/1]" : aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <div
        className={`relative ${aspectCls} w-full rounded-md border border-dashed border-input bg-muted/30 overflow-hidden grid place-items-center`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-background/90 border border-border"
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
            <Upload className="size-5" />
            No image
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="size-3.5 mr-1.5" /> Upload
        </Button>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Input
          placeholder="Or paste image URL"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = (r.result as string) ?? "";
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
