import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { CopyButtons } from "@/components/copy-buttons";
import { ScoreRing } from "@/components/score-ring";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ALL_SKILLS } from "@/lib/role-packs";

export type Tailoring = {
  company: string | null;
  role_title: string | null;
  created_at: string;
  jd_text: string;
  result_md: string;
  changes: string[];
  ai_score: number | null;
  strengths: string[];
  weaknesses: string[];
  coverage_pct: number;
  matched: string[];
  gaps: string[];
  flagged: string[];
  skill_names: Record<string, string>;
};

const PACK_NAMES = new Map(ALL_SKILLS.map((s) => [s.id, s.name]));

function Chips({ keys, names, variant }: { keys: string[]; names: Record<string, string>; variant: "secondary" | "outline" | "destructive" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => (
        <Badge key={k} variant={variant}>
          {names[k] ?? PACK_NAMES.get(k) ?? k}
        </Badge>
      ))}
    </div>
  );
}

export function ResultView({ t }: { t: Tailoring }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/resumes">
          <ArrowLeft /> My resumes
        </Link>
      </Button>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.role_title || "Tailored resume"}</h1>
      <p className="text-muted-foreground">
        {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleString()}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="h-fit bg-white">
          <CardContent className="resume">
            <Markdown>{t.result_md}</Markdown>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="flex justify-around">
              <ScoreRing value={t.ai_score ?? 0} label="Screener score" />
              <ScoreRing value={t.coverage_pct} label="Skill coverage" />
            </CardContent>
          </Card>

          <CopyButtons markdown={t.result_md} filename={`${t.company || "resume"}-${t.role_title || "tailored"}`} />

          {t.flagged.length > 0 ? (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>Honesty guard: review these</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>The resume still mentions skills you haven&apos;t confirmed. Edit them out or update your Skills.</p>
                <Chips keys={t.flagged} names={t.skill_names} variant="destructive" />
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <ShieldCheck />
              <AlertTitle>Honesty guard passed</AlertTitle>
              <AlertDescription>Every skill on this resume is one you confirmed or already had.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>What changed</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {t.changes.map((c) => (
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
              {t.strengths.map((s) => (
                <p key={s} className="flex gap-2">
                  <span className="font-semibold text-success">+</span>
                  {s}
                </p>
              ))}
              {t.weaknesses.map((w) => (
                <p key={w} className="flex gap-2">
                  <span className="font-semibold text-destructive">−</span>
                  {w}
                </p>
              ))}
            </CardContent>
          </Card>

          {(t.matched.length > 0 || t.gaps.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Skills this job asks for</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Chips keys={t.matched} names={t.skill_names} variant="secondary" />
                {t.gaps.length > 0 && (
                  <>
                    <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Gaps (left off the resume)
                    </p>
                    <Chips keys={t.gaps} names={t.skill_names} variant="outline" />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <Collapsible>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    Show job description
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{t.jd_text}</p>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </aside>
      </div>
    </main>
  );
}
