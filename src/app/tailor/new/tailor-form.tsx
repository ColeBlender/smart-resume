"use client";

import { Sparkles } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { SkillChips } from "@/components/skill-chips";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { RolePack } from "@/lib/role-packs";
import { matchJd, type Answers } from "@/lib/scoring";
import { runTailoring } from "./actions";

const STEPS = ["Rewriting your resume for this job", "Running the honesty guard", "Scoring it like their screener"];

export function TailorForm({ pack, answers }: { pack: RolePack; answers: Answers }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  // Same deterministic matcher the server uses, run on every keystroke.
  const deferredJd = useDeferredValue(jd);
  const match = useMemo(() => matchJd(deferredJd, pack, answers), [deferredJd, pack, answers]);
  const detected = match.matched.length + match.gaps.length;

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 8000);
    return () => clearInterval(t);
  }, [pending]);

  function submit() {
    setStep(0);
    startTransition(async () => {
      const result = await runTailoring({ jd, company, roleTitle });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role title</Label>
              <Input id="role" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jd">Job description</Label>
            <Textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={18}
              placeholder="Paste the full job description here…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={submit} disabled={pending || jd.trim().length < 200}>
              {pending ? <Spinner /> : <Sparkles />}
              {pending ? "Working…" : "Tailor my resume"}
            </Button>
            {pending && <span className="text-sm text-muted-foreground">{STEPS[step]}… usually under a minute</span>}
            {!pending && jd.trim().length > 0 && jd.trim().length < 200 && (
              <span className="text-sm text-muted-foreground">Paste the full posting (200+ characters).</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardDescription>Live match · {pack.title}</CardDescription>
          <CardTitle className="text-4xl font-bold tabular-nums">{detected ? `${match.coveragePct}%` : "–"}</CardTitle>
          {detected > 0 && <Progress value={match.coveragePct} />}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {detected === 0 ? (
            <p className="text-muted-foreground">Skills this job asks for will appear here as you paste.</p>
          ) : (
            <>
              <p className="text-muted-foreground">of the {detected} skills this job asks for, weighted by demand.</p>
              {match.matched.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">You have</div>
                  <SkillChips skills={match.matched} tone="match" />
                </div>
              )}
              {match.gaps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Gaps (won&apos;t be claimed)
                  </div>
                  <SkillChips skills={match.gaps} tone="gap" />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
