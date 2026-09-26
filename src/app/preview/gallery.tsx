"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { HistoryList } from "@/components/history-list";
import { JobComposer, type ComposerActions } from "@/components/job-composer";
import { LandingView } from "@/components/landing-view";
import { OnboardingWizard, type OnboardingActions, type OnboardingState } from "@/components/onboarding-wizard";
import { ResultView } from "@/components/result-view";
import { SkillsView } from "@/components/skills-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnknownSkillsDialog } from "@/components/unknown-skills-dialog";
import { ROLE_PACKS } from "@/lib/role-packs";
import { ANALYSIS, HISTORY, JD, PREFILL, PREVIEW_USER, RESULT, RESULT_FLAGGED, RESUME, ROLES, SKILLS, UNKNOWN } from "./fixtures";

const wait = <T,>(ms: number, value: T) => new Promise<T>((r) => setTimeout(() => r(value), ms));
const hang = <T,>() => new Promise<T>(() => {});
const noop = () => {};

// Mock actions: fast and fake. "hang" versions freeze a loading state on screen.
const onboarding: OnboardingActions = {
  extractResume: () => wait(1200, { text: RESUME }),
  prefillSkills: () => wait(1200, { ratings: PREFILL, roles: ROLES }),
  finishOnboarding: () => wait(600, { ok: true as const }),
};
const onboardingHang: OnboardingActions = { ...onboarding, prefillSkills: hang };

const composer: ComposerActions = {
  analyzeJobAction: () => wait(1200, { analysis: ANALYSIS, unknown: UNKNOWN, roles: ROLES }),
  saveJobSkills: () => wait(300, { ok: true as const }),
  tailorJob: () => wait(2500, READY),
};
const composerKnown: ComposerActions = { ...composer, analyzeJobAction: () => wait(1200, { analysis: ANALYSIS, unknown: [], roles: ROLES }) };
const composerFails: ComposerActions = {
  ...composer,
  analyzeJobAction: () => wait(800, { error: "Paste the full job description (a few paragraphs)." }),
};

const resultHref = () => "/preview#result-clean";
const READY = {
  id: "demo-1",
  title: "Senior Full-stack Engineer",
  company: "Northwind",
  score: 81,
  coverage: 72,
  flagged: 0,
  markdown: RESULT.result_md,
};


type Scenario = { id: string; group: string; label: string; note?: string; render: () => React.ReactNode };

function onboard(initial: OnboardingState, actions = onboarding) {
  return function OnboardScenario() {
    return (
      <Page path="/onboard">
        <main className="flex flex-1 items-start justify-center px-4 py-10">
          <OnboardingWizard packs={ROLE_PACKS} actions={actions} initial={initial} onFinished={noop} />
        </main>
      </Page>
    );
  };
}

function home(node: React.ReactNode) {
  return function HomeScenario() {
    return (
      <Page>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">{node}</main>
      </Page>
    );
  };
}

const RATED = Object.fromEntries(PREFILL.filter((p) => p.rating).map((p) => [p.key, p.rating!])) as OnboardingState["ratings"];

const SCENARIOS: Scenario[] = [
  { id: "landing", group: "Landing", label: "Signed out", render: () => <Page signedOut><LandingView /></Page> },
  { id: "landing-error", group: "Landing", label: "Sign-in failed", render: () => <Page signedOut><LandingView error /></Page> },

  { id: "onboard-resume", group: "Onboarding", label: "1 · Resume (empty)", note: "Upload any file: the fake reader fills in a sample resume.", render: onboard({}) },
  { id: "onboard-resume-reading", group: "Onboarding", label: "1 · Resume (reading upload)", render: onboard({ reading: true }) },
  { id: "onboard-resume-filled", group: "Onboarding", label: "1 · Resume (filled)", render: onboard({ resume: RESUME }) },
  { id: "onboard-role", group: "Onboarding", label: "2 · Pick a role", render: onboard({ step: "role", resume: RESUME }) },
  { id: "onboard-rate-loading", group: "Onboarding", label: "3 · Rate (Claude pre-rating)", render: onboard({ step: "rate", resume: RESUME, packId: "fullstack" }, onboardingHang) },
  { id: "onboard-rate", group: "Onboarding", label: "3 · Rate (pre-filled, page 1)", render: onboard({ step: "rate", resume: RESUME, packId: "fullstack", prefill: PREFILL, ratings: RATED }) },
  { id: "onboard-rate-last", group: "Onboarding", label: "3 · Rate (last page)", render: onboard({ step: "rate", resume: RESUME, packId: "fullstack", prefill: PREFILL, ratings: RATED, page: 5 }) },
  { id: "onboard-strengths", group: "Onboarding", label: "4 · Back up strengths", render: onboard({ step: "strengths", resume: RESUME, packId: "fullstack", prefill: PREFILL, roles: ROLES, ratings: { ...RATED, "ci-cd": 4, docker: 5, aws: 4 } }) },

  { id: "home-flow", group: "Home", label: "Full flow (interactive)", note: "Press Tailor: analyze → 3 questions → tailoring → ready modal. All fake, all fast.", render: home(<JobComposer actions={composer} initial={{ jd: JD }} resultHref={resultHref} />) },
  { id: "home-flow-known", group: "Home", label: "Full flow, nothing to ask", note: "Press Tailor: skips the questions and goes straight to tailoring.", render: home(<JobComposer actions={composerKnown} initial={{ jd: JD }} resultHref={resultHref} />) },
  { id: "home-empty", group: "Home", label: "Empty", render: home(<JobComposer actions={composer} resultHref={resultHref} />) },
  { id: "home-analyzing", group: "Home", label: "Reading the job", render: home(<JobComposer actions={composer} initial={{ jd: JD, phase: "analyzing" }} />) },
  { id: "home-tailoring", group: "Home", label: "Tailoring", render: home(<JobComposer actions={composer} initial={{ jd: JD, phase: "tailoring" }} />) },
  { id: "home-ready", group: "Home", label: "Resume ready (modal)", render: home(<JobComposer actions={composer} initial={{ ready: READY }} resultHref={resultHref} />) },
  { id: "home-ready-flagged", group: "Home", label: "Resume ready, guard flagged", render: home(<JobComposer actions={composer} initial={{ ready: { ...READY, score: 64, flagged: 1 } }} resultHref={resultHref} />) },
  { id: "home-error", group: "Home", label: "Error toast", note: "Press Tailor to see the error toast.", render: home(<JobComposer actions={composerFails} initial={{ jd: JD }} />) },

  { id: "ask-1", group: "Tell us more (modal)", label: "Question 1 of 3", render: home(<><JobComposer actions={composer} initial={{ jd: JD }} /><UnknownSkillsDialog open skills={UNKNOWN} roles={ROLES} onDone={() => toast.success("Answers saved (preview)")} onCancel={noop} /></>) },
  { id: "ask-note", group: "Tell us more (modal)", label: "Rated 3+ (jobs + what you did)", render: home(<><JobComposer actions={composer} initial={{ jd: JD }} /><UnknownSkillsDialog open skills={UNKNOWN} roles={ROLES} initialRatings={{ "x-kafka": 4 }} initialUsedAt={{ "x-kafka": [{ role: "Acme Payments · Senior Software Engineer", what: "Ran our order and payout event pipeline on Kafka, about 2M events a day." }, { role: "Side project", what: "" }] }} onDone={noop} onCancel={noop} /></>) },
  { id: "ask-last", group: "Tell us more (modal)", label: "Last question", render: home(<><JobComposer actions={composer} initial={{ jd: JD }} /><UnknownSkillsDialog open skills={UNKNOWN} roles={ROLES} initialIndex={2} initialRatings={{ "x-kafka": 4, kubernetes: 2, graphql: 1 }} onDone={noop} onCancel={noop} /></>) },

  { id: "toast-error", group: "Toasts", label: "Error", render: () => <Page><main className="p-10"><Button variant="destructive" onClick={() => toast.error("Tailoring failed. Please try again.")}>Fire toast</Button></main></Page> },

  { id: "resumes", group: "My resumes", label: "With resumes", render: () => <Page path="/resumes"><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10"><HistoryList rows={HISTORY} /></main></Page> },
  { id: "resumes-empty", group: "My resumes", label: "None yet", render: () => <Page path="/resumes"><main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10"><HistoryList rows={[]} /></main></Page> },

  { id: "result-clean", group: "Result", label: "Guard passed", render: () => <Page path="/tailor/demo"><ResultView t={RESULT} /></Page> },
  { id: "result-flagged", group: "Result", label: "Guard flagged a skill", render: () => <Page path="/tailor/demo"><ResultView t={RESULT_FLAGGED} /></Page> },

  { id: "skills", group: "Profile", label: "Resume + skills", note: "Try Replace: upload any file or paste.", render: () => <Page path="/profile"><SkillsView initial={SKILLS} roles={ROLES} baseResume={RESUME} actions={{ updateSkill: () => wait(300, { ok: true as const }), replaceResume: () => wait(1500, { ok: true as const }), extractResume: () => wait(1200, { text: RESUME }) }} /></Page> },
  { id: "skills-empty", group: "Profile", label: "No skills yet", render: () => <Page path="/profile"><SkillsView initial={[]} roles={ROLES} baseResume={RESUME} actions={{ updateSkill: () => wait(300, { ok: true as const }), replaceResume: () => wait(1500, { ok: true as const }), extractResume: () => wait(1200, { text: RESUME }) }} /></Page> },
];

function Page({ children, signedOut, path = "/dashboard" }: { children: React.ReactNode; signedOut?: boolean; path?: string }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header user={signedOut ? undefined : PREVIEW_USER} path={path} />
      {children}
    </div>
  );
}

export function Gallery() {
  const [id, setId] = useState(SCENARIOS[0].id);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (SCENARIOS.some((s) => s.id === h)) setId(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const current = SCENARIOS.find((s) => s.id === id)!;
  const groups = [...new Set(SCENARIOS.map((s) => s.group))];

  function open(next: string) {
    window.history.replaceState(null, "", `#${next}`);
    setId(next);
    setNonce((n) => n + 1);
  }

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 overflow-y-auto border-r p-4 md:block">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-semibold">UI preview</span>
          <Badge variant="secondary">{SCENARIOS.length} states</Badge>
        </div>
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <p className="mb-1 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">{g}</p>
            {SCENARIOS.filter((s) => s.group === g).map((s) => (
              <Button
                key={s.id}
                variant={s.id === id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => open(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2 text-sm">
          <Badge>{current.group}</Badge>
          <span className="font-medium">{current.label}</span>
          {current.note && <span className="text-muted-foreground">· {current.note}</span>}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setNonce((n) => n + 1)}>
            Reset
          </Button>
        </div>
        <div key={`${id}-${nonce}`} className="flex flex-1 flex-col">
          {current.render()}
        </div>
      </div>
    </div>
  );
}
