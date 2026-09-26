"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Prefill, PrefillResult } from "@/app/onboard/actions";
import type { RolePack } from "@/lib/role-packs";
import { strengthsNeedingNotes, type Rating, type Role, type SkillProfile, type SkillUse } from "@/lib/scoring";
import { RatingLegend } from "./wizard/rating-picker";
import { SkillContextFields } from "./wizard/skill-context-fields";
import { SkillRatingItem } from "./wizard/skill-rating-item";
import { WizardCard } from "./wizard/wizard-card";

const PAGE_SIZE = 6;
const TOTAL_STEPS = 4;

export type OnboardingActions = {
  extractResume: (formData: FormData) => Promise<{ text: string } | { error: string }>;
  prefillSkills: (input: { resume: string; packId: string }) => Promise<PrefillResult | { error: string }>;
  finishOnboarding: (input: {
    resume: string;
    packId: string;
    roles: Role[];
    skills: { key: string; name: string; rating: number; note?: string | null; usedAt?: SkillUse[] }[];
  }) => Promise<{ error: string } | { ok: true }>;
};

type Step = "resume" | "role" | "rate" | "strengths";

/** Initial state is overridable so /preview can open any screen directly. */
export type OnboardingState = {
  step?: Step;
  resume?: string;
  packId?: string;
  ratings?: Record<string, Rating>;
  prefill?: Prefill[] | null;
  page?: number;
  notes?: Record<string, string>;
  roles?: Role[];
  usedAt?: Record<string, SkillUse[]>;
};

export function OnboardingWizard({
  packs,
  actions,
  initial = {},
  onFinished,
}: {
  packs: RolePack[];
  actions: OnboardingActions;
  initial?: OnboardingState;
  /** Defaults to going to the dashboard. /preview overrides it to stay put. */
  onFinished?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initial.step ?? "resume");
  const [resume, setResume] = useState(initial.resume ?? "");
  const [packId, setPackId] = useState<string | undefined>(initial.packId);
  const [ratings, setRatings] = useState<Record<string, Rating>>(initial.ratings ?? {});
  const [prefill, setPrefill] = useState<Prefill[] | null>(initial.prefill ?? null);
  const [page, setPage] = useState(initial.page ?? 0);
  const [notes] = useState<Record<string, string>>(initial.notes ?? {});
  const [roles, setRoles] = useState<Role[]>(initial.roles ?? []);
  const [usedAt, setUsedAt] = useState<Record<string, SkillUse[]>>(initial.usedAt ?? {});
  const [pending, startTransition] = useTransition();

  const pack = packs.find((p) => p.id === packId);
  const pages = pack ? Math.ceil(pack.skills.length / PAGE_SIZE) : 0;
  const evidence = new Map((prefill ?? []).map((p) => [p.key, p]));

  const profile: SkillProfile = Object.fromEntries(
    Object.entries(ratings).map(([key, rating]) => [key, { key, name: key, rating, note: notes[key] || null, usedAt: usedAt[key] }]),
  );
  // Freeze the list when the step opens, so a skill doesn't vanish as soon as you describe it.
  const [strengthKeys, setStrengthKeys] = useState<string[] | null>(null);
  const liveStrengths = pack ? strengthsNeedingNotes(pack.skills, profile, resume) : [];
  const strengths = strengthKeys && pack ? pack.skills.filter((s) => strengthKeys.includes(s.id)) : liveStrengths;

  function upload(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await actions.extractResume(fd);
      if ("error" in result) toast.error(result.error);
      else {
        setResume(result.text);
        toast.success("Resume read. Check it over, then continue.");
      }
    });
  }

  function toRate() {
    if (!pack) return;
    setStep("rate");
    setPage(0);
    if (prefill) return;
    startTransition(async () => {
      const result = await actions.prefillSkills({ resume, packId: pack.id });
      if ("error" in result) {
        toast.error(result.error);
        setPrefill([]);
        return;
      }
      setPrefill(result.ratings);
      setRoles(result.roles);
      setRatings((current) => {
        const next = { ...current };
        for (const r of result.ratings) if (r.rating && !next[r.key]) next[r.key] = r.rating as Rating;
        return next;
      });
    });
  }

  function finish() {
    if (!pack) return;
    startTransition(async () => {
      const result = await actions.finishOnboarding({
        resume,
        packId: pack.id,
        roles,
        skills: pack.skills
          .filter((s) => ratings[s.id])
          .map((s) => ({ key: s.id, name: s.name, rating: ratings[s.id], note: notes[s.id], usedAt: usedAt[s.id] })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("You're all set. Paste a job to get started.");
      if (onFinished) return onFinished();
      router.push("/dashboard");
      router.refresh();
    });
  }

  function nextFromRate() {
    if (page < pages - 1) return setPage(page + 1);
    if (strengths.length) {
      setStrengthKeys(strengths.map((s) => s.id));
      return setStep("strengths");
    }
    finish();
  }

  if (step === "resume") {
    return (
      <WizardCard
        step={1}
        total={TOTAL_STEPS}
        title="Start with your current resume"
        description="This is your baseline. Every tailored resume is built only from what's in it plus what you confirm next."
        footer={
          <>
            <span />
            <Button onClick={() => setStep("role")} disabled={pending || resume.trim().length < 200}>
              Continue <ArrowRight />
            </Button>
          </>
        }
      >
        <Tabs defaultValue={resume ? "paste" : "upload"}>
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Paste</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            {pending ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Spinner />
                  </EmptyMedia>
                  <EmptyTitle>Reading your resume…</EmptyTitle>
                  <EmptyDescription>Claude is transcribing it word for word.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Field>
                <FieldLabel htmlFor="resume-file">Resume file</FieldLabel>
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <FieldDescription>PDF, DOCX, TXT or Markdown, up to 5 MB.</FieldDescription>
              </Field>
            )}
            {resume && !pending && (
              <Alert className="mt-4">
                <Check />
                <AlertDescription>Got it. Review or edit the text on the Paste tab, then continue.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="paste" className="pt-4">
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={14}
              placeholder={"Jane Doe\nSenior Software Engineer\n\nExperience\nAcme Corp (2021 to present)\n- Built…"}
              className="font-mono text-sm"
            />
          </TabsContent>
        </Tabs>
      </WizardCard>
    );
  }

  if (step === "role") {
    return (
      <WizardCard
        step={2}
        total={TOTAL_STEPS}
        title="What role are you going for?"
        description="We'll ask about the skills real postings for this role actually list."
        footer={
          <>
            <Button variant="ghost" onClick={() => setStep("resume")}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={toRate} disabled={!pack}>
              Continue <ArrowRight />
            </Button>
          </>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {packs.map((p) => (
            <Button
              key={p.id}
              variant={p.id === packId ? "default" : "outline"}
              size="lg"
              className="justify-start"
              onClick={() => {
                if (p.id !== packId) setPrefill(null);
                setPackId(p.id);
              }}
            >
              {p.title}
            </Button>
          ))}
        </div>
      </WizardCard>
    );
  }

  if (step === "rate" && pack) {
    const loading = pending && !prefill;
    const pageSkills = pack.skills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    return (
      <WizardCard
        step={3}
        total={TOTAL_STEPS}
        title="Rate your skills, honestly"
        description={
          loading
            ? "Claude is reading your resume and pre-rating what it can."
            : `Page ${page + 1} of ${pages}. We pre-rated what your resume shows. Adjust anything, skip what you're unsure of.`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => (page > 0 ? setPage(page - 1) : setStep("role"))} disabled={pending}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={nextFromRate} disabled={pending}>
              {pending && !loading && <Spinner />}
              {page < pages - 1 || strengths.length ? "Next" : "Finish"} <ArrowRight />
            </Button>
          </>
        }
      >
        {loading ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>Reading your resume…</EmptyTitle>
              <EmptyDescription>Pre-rating {pack.skills.length} {pack.title} skills from what you&apos;ve written.</EmptyDescription>
            </EmptyHeader>
            <Spinner />
          </Empty>
        ) : (
          <div className="space-y-3">
            <RatingLegend />
            <ItemGroup className="gap-2">
              {pageSkills.map((s) => {
                const p = evidence.get(s.id);
                return (
                  <SkillRatingItem
                    key={s.id}
                    name={s.name}
                    hint={`${s.frequency_pct}% of postings`}
                    evidence={p?.evidence}
                    aiRated={!!p?.rating}
                    value={ratings[s.id]}
                    onChange={(r) => setRatings((cur) => ({ ...cur, [s.id]: r }))}
                  />
                );
              })}
            </ItemGroup>
          </div>
        )}
      </WizardCard>
    );
  }

  return (
    <WizardCard
      step={4}
      total={TOTAL_STEPS}
      title="Put your strengths in context"
      description="You rated these high, but your resume doesn't show them. Tell us where you used each one and what you did, and Claude can write it into that job. Optional."
      footer={
        <>
          <Button variant="ghost" onClick={() => setStep("rate")} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
          <Button onClick={finish} disabled={pending}>
            {pending ? <Spinner /> : <Check />} Finish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {strengths.map((s) => (
          <Item key={s.id} variant="outline" className="flex-col items-stretch">
            <ItemContent>
              <ItemTitle>{s.name}</ItemTitle>
            </ItemContent>
            <SkillContextFields
              idPrefix={s.id}
              skillName={s.name}
              roles={roles}
              uses={usedAt[s.id] ?? []}
              onChange={(uses) => setUsedAt((u) => ({ ...u, [s.id]: uses }))}
            />
          </Item>
        ))}
      </div>
    </WizardCard>
  );
}

