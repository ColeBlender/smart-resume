import { Header } from "@/components/header";
import { HistoryList } from "@/components/history-list";
import { requireProfile } from "@/lib/profile";

export default async function ResumesPage() {
  const { supabase, user } = await requireProfile();
  const { data: rows } = await supabase
    .from("tailorings")
    .select("id, company, role_title, ai_score, coverage_pct, flagged, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <HistoryList rows={(rows ?? []).map((r) => ({ ...r, flagged: r.flagged as unknown[] }))} />
      </main>
    </>
  );
}
