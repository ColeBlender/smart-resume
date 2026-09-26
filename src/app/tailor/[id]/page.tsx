import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import { Header } from "@/components/header";
import { ScoreRing } from "@/components/score-ring";
import { SkillChips } from "@/components/skill-chips";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { requireProfile } from "@/lib/profile";
import { ROLE_PACKS, type Skill } from "@/lib/role-packs";
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
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft /> All tailored resumes
          </Link>
        </Button>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.role_title || "Tailored resume"}</h1>
        <p className="text-muted-foreground">
          {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleString()}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="resume h-fit rounded-xl border bg-white p-8 shadow-sm">
            <Markdown>{t.result_md}</Markdown>
          </article>

          <aside className="space-y-4">
            <Card>
              <CardContent className="flex justify-around">
                <ScoreRing value={t.ai_score ?? 0} label="Screener score" />
                <ScoreRing value={t.coverage_pct} label="Skill coverage" />
              </CardContent>
            </Card>

            <CopyButtons markdown={t.result_md} filename={`${t.company || "resume"}-${t.role_title || "tailored"}`} />

            {flagged.length > 0 && (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Honesty guard: review these</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The resume still mentions skills you never confirmed. Remove them or confirm them in Skills.</p>
                  <SkillChips skills={flagged} tone="flag" />
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>What changed</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {(t.changes as string[]).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screener&apos;s take</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {(t.strengths as string[]).map((s) => (
                  <p key={s} className="flex gap-2">
                    <span className="font-semibold text-success">+</span>
                    {s}
                  </p>
                ))}
                {(t.weaknesses as string[]).map((w) => (
                  <p key={w} className="flex gap-2">
                    <span className="font-semibold text-destructive">−</span>
                    {w}
                  </p>
                ))}
              </CardContent>
            </Card>

            {(matched.length > 0 || gaps.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills this job asks for</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SkillChips skills={matched} tone="match" />
                  {gaps.length > 0 && (
                    <>
                      <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Gaps (left off the resume)
                      </div>
                      <SkillChips skills={gaps} tone="gap" />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <Collapsible>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-2 justify-start">
                      Show job description
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{t.jd_text}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
