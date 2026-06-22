import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your account — Royal Sweets" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, default_address")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.default_address ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone, default_address: address })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-6xl">Your account</h1>
          <p className="mt-2 text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 h-11 text-sm font-medium hover:bg-primary transition-colors"
          >
            View orders
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 h-11 text-sm hover:border-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>

      <form onSubmit={save} className="mt-12 max-w-xl space-y-4">
        <h2 className="font-display text-3xl">Profile</h2>
        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Default delivery address" value={address} onChange={setAddress} />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary text-primary-foreground px-6 h-12 font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full h-12 rounded-2xl bg-card border border-border px-4 focus:outline-none focus:border-primary"
      />
    </label>
  );
}