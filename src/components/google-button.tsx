"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Redirecting to Google…" : "Continue with Google"}
    </button>
  );
}
