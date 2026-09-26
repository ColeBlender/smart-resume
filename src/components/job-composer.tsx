"use client";

import { CornerDownLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { JobAnalysis } from "@/lib/claude";
import type { JobSkill, Role } from "@/lib/scoring";
import { ResumeReadyDialog, type ReadyResume } from "./resume-ready-dialog";
import { UnknownSkillsDialog, type SkillEntry } from "./unknown-skills-dialog";

export type ComposerActions = {
  analyzeJobAction: (jd: string) => Promise<{ analysis: JobAnalysis; unknown: JobSkill[]; roles: Role[] } | { error: string }>;
  saveJobSkills: (entries: SkillEntry[]) => Promise<{ ok: true } | { error: string }>;
  tailorJob: (input: { jd: string; analysis: JobAnalysis }) => Promise<ReadyResume | { error: string }>;
};

type Phase = "idle" | "analyzing" | "asking" | "tailoring";

export type ComposerState = {
  jd?: string;
  phase?: Phase;
  analysis?: JobAnalysis;
  unknown?: JobSkill[];
  roles?: Role[];
  ready?: ReadyResume;
};

const TAILOR_STAGES = [
  "Rewriting your resume for this job",
  "Running the honesty guard",
  "Scoring it like their resume screener",
];

export function JobComposer({
  actions,
  initial = {},
  resultHref = (id) => `/tailor/${id}`,
}: {
  actions: ComposerActions;
  initial?: ComposerState;
  /** Where the toast's Open button goes. /preview points it at a fixture. */
  resultHref?: (id: string) => string;
}) {
  const router = useRouter();
  const [jd, setJd] = useState(initial.jd ?? "");
  const [phase, setPhase] = useState<Phase>(initial.phase ?? "idle");
  const [analysis, setAnalysis] = useState<JobAnalysis | undefined>(initial.analysis);
  const [unknown, setUnknown] = useState<JobSkill[]>(initial.unknown ?? []);
  const [roles, setRoles] = useState<Role[]>(initial.roles ?? []);
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState<ReadyResume | null>(initial.ready ?? null);

  useEffect(() => {
    if (phase !== "tailoring") return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, TAILOR_STAGES.length - 1)), 7000);
    return () => clearInterval(t);
  }, [phase]);

  const busy = phase !== "idle";
  const longEnough = jd.trim().length >= 200;

  async function start() {
    if (busy || !longEnough) return;
    setPhase("analyzing");
    const result = await actions.analyzeJobAction(jd);
    if ("error" in result) {
      toast.error(result.error);
      return setPhase("idle");
    }
    setAnalysis(result.analysis);
    if (result.unknown.length) {
      setUnknown(result.unknown);
      setRoles(result.roles);
      return setPhase("asking");
    }
    await tailor(result.analysis);
  }

  async function answered(entries: SkillEntry[]) {
    setPhase("tailoring");
    const saved = await actions.saveJobSkills(entries);
    if ("error" in saved) {
      toast.error(saved.error);
      return setPhase("idle");
    }
    await tailor(analysis!);
  }

  async function tailor(a: JobAnalysis) {
    setStage(0);
    setPhase("tailoring");
    const result = await actions.tailorJob({ jd, analysis: a });
    setPhase("idle");
    if ("error" in result) return toast.error(result.error);
    setJd("");
    router.refresh();
    setReady(result);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Paste a job description</CardTitle>
        <CardDescription>We&apos;ll tailor your resume to it. Only skills you&apos;ve confirmed make it in.</CardDescription>
      </CardHeader>
      <CardContent>
        {phase === "analyzing" || phase === "tailoring" ? (
          <Empty className="min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>{phase === "analyzing" ? "Reading the job description…" : `${TAILOR_STAGES[stage]}…`}</EmptyTitle>
              <EmptyDescription>
                {phase === "analyzing"
                  ? "Finding every skill it asks for and checking it against your profile."
                  : "This takes about a minute. You'll get a notification when it's ready."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start();
              }
            }}
            rows={14}
            placeholder="Paste the full job description here, then press Enter."
            disabled={busy}
            className="min-h-72"
          />
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          <Kbd>Enter</Kbd> to tailor · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line
        </span>
        <Button onClick={start} disabled={busy || !longEnough}>
          <Sparkles /> Tailor <CornerDownLeft />
        </Button>
      </CardFooter>

      <ResumeReadyDialog resume={ready} href={ready ? resultHref(ready.id) : "#"} onClose={() => setReady(null)} />

      {phase === "asking" && (
        <UnknownSkillsDialog
          open
          skills={unknown}
          roles={roles}
          onDone={answered}
          onCancel={() => {
            setPhase("idle");
            toast("Cancelled. Your job description is still here.");
          }}
        />
      )}
    </Card>
  );
}
