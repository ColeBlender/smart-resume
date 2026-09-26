import { HistoryList } from "@/components/history-list";
import { requireProfile } from "@/lib/profile";

export default async function ResumesPage() {
  const { supabase } = await requireProfile();
  const { data: rows } = await supabase
    .from("tailorings")
    .select("id, company, role_title, result_md, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <HistoryList rows={rows ?? []} />
      </main>
    </>
  );
}
