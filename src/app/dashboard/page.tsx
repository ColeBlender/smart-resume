import Link from "next/link";
import { Header } from "@/components/header";
import { ScoreRing } from "@/components/score-ring";
import { requireProfile } from "@/lib/profile";
import { weightedCoverage } from "@/lib/scoring";

export default async function Dashboard() {
  const { supabase, user, pack, answers } = await requireProfile();

  const { data: tailorings } = await supabase
    .from("tailorings")
    .select("id, company, role_title, ai_score, coverage_pct, flagged, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const coverage = weightedCoverage(pack.skills, answers);
  // Heaviest skills the user said no to (or skipped): what to learn next for this role.
  const toLearn = pack.skills.filter((s) => (answers[s.id] ?? "no") === "no").slice(0, 5);

  return (
    <>
      <Header email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Targeting</p>
            <h1 className="font-serif text-3xl font-semibold">{pack.title}</h1>
          </div>
          <Link
            href="/tailor/new"
            className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90"
          >
            Tailor for a new job
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg border border-line bg-card p-5">
            <ScoreRing value={coverage} />
            <div>
              <div className="font-semibold">Role coverage</div>
              <p className="text-sm text-muted">Weighted by how often {pack.postings_sampled} real postings ask for each skill.</p>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-card p-5 md:col-span-2">
            <div className="font-semibold">Highest-value skills you don&apos;t have yet</div>
            {toLearn.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {toLearn.map((s) => (
                  <li key={s.id} className="rounded-full bg-warn-soft px-3 py-1 text-sm text-warn">
                    {s.name} · {s.frequency_pct}% of postings
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">You cover every skill in this role pack.</p>
            )}
            <Link href="/onboard" className="mt-3 inline-block text-sm text-accent hover:underline">
              Update skills or resume
            </Link>
          </div>
        </div>

        <h2 className="mt-12 font-semibold">Tailored resumes</h2>
        {tailorings?.length ? (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card">
            {tailorings.map((t) => (
              <li key={t.id}>
                <Link href={`/tailor/${t.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-paper">
                  <div className="flex-1">
                    <div className="font-medium">{t.role_title || "Untitled role"}</div>
                    <div className="text-sm text-muted">
                      {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {(t.flagged as unknown[]).length > 0 && (
                    <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs text-bad">needs review</span>
                  )}
                  <div className="text-right text-sm">
                    <div className="font-semibold">{t.ai_score ?? "–"}</div>
                    <div className="text-muted">screener</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{t.coverage_pct}%</div>
                    <div className="text-muted">coverage</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-line p-8 text-center text-muted">
            No tailored resumes yet. Paste a job description to make your first one.
          </div>
        )}
      </main>
    </>
  );
}
