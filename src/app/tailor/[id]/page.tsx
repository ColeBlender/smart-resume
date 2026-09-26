import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { Header } from "@/components/header";
import { ScoreRing } from "@/components/score-ring";
import { ROLE_PACKS, type Skill } from "@/lib/role-packs";
import { requireProfile } from "@/lib/profile";
import { CopyButtons } from "./copy-buttons";

export default async function TailoringPage({ params }: PageProps<"/tailor/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireProfile();

  // RLS limits this to the user's own rows; someone else's id is simply not found.
  const { data: t } = await supabase.from("tailorings").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();

  // Skill ids are shared across packs, so an older tailoring made under another role still resolves.
  const skillsById = new Map(ROLE_PACKS.flatMap((p) => p.skills).map((s) => [s.id, s]));
  const names = (ids: string[]) => ids.map((i) => skillsById.get(i)).filter((s): s is Skill => !!s);
  const matched = names(t.matched);
  const gaps = names(t.gaps);
  const flagged = names(t.flagged);

  return (
    <>
      <Header email={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
          ← All tailored resumes
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold">{t.role_title || "Tailored resume"}</h1>
        <p className="text-muted">
          {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleString()}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <article className="resume rounded-lg border border-line bg-white p-8 shadow-sm">
            <Markdown>{t.result_md}</Markdown>
          </article>

          <aside className="space-y-4">
            <div className="flex justify-around rounded-lg border border-line bg-card p-5">
              <ScoreRing value={t.ai_score ?? 0} label="Screener score" />
              <ScoreRing value={t.coverage_pct} label="Skill coverage" />
            </div>

            <CopyButtons markdown={t.result_md} filename={`${t.company || "resume"}-${t.role_title || "tailored"}`} />

            {flagged.length > 0 && (
              <Panel title="Honesty guard: review these" tone="border-bad bg-bad-soft">
                <p className="text-sm">
                  The resume still mentions skills you never confirmed. Remove them or confirm them in your skills.
                </p>
                <Chips skills={flagged} tone="bg-white text-bad" />
              </Panel>
            )}

            <Panel title="What changed">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {(t.changes as string[]).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Panel>

            <Panel title="Screener's take">
              <List items={t.strengths as string[]} sign="+" tone="text-accent" />
              <List items={t.weaknesses as string[]} sign="−" tone="text-bad" />
            </Panel>

            {(matched.length > 0 || gaps.length > 0) && (
              <Panel title="Skills this job asks for">
                <Chips skills={matched} tone="bg-accent-soft text-accent" />
                {gaps.length > 0 && (
                  <>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted">
                      Gaps (left off the resume)
                    </div>
                    <Chips skills={gaps} tone="bg-warn-soft text-warn" />
                  </>
                )}
              </Panel>
            )}

            <details className="rounded-lg border border-line bg-card p-5 text-sm">
              <summary className="cursor-pointer font-semibold">Job description</summary>
              <p className="mt-3 whitespace-pre-wrap text-muted">{t.jd_text}</p>
            </details>
          </aside>
        </div>
      </main>
    </>
  );
}

function Panel({ title, tone = "border-line bg-card", children }: { title: string; tone?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-lg border p-5 ${tone}`}>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ skills, tone }: { skills: Skill[]; tone: string }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <li key={s.id} className={`rounded-full px-2.5 py-0.5 text-xs ${tone}`}>
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function List({ items, sign, tone }: { items: string[]; sign: string; tone: string }) {
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <span className={`font-semibold ${tone}`}>{sign}</span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}
