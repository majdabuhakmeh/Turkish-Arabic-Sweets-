import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Royal Sweets" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/account" });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-5xl">Set new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">New password</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
            className="mt-2 w-full h-12 rounded-2xl bg-card border border-border px-4 focus:outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    </div>
  );
}