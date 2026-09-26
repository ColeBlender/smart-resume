"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import type { RolePack } from "@/lib/role-packs";
import { matchJd, type Answers } from "@/lib/scoring";
import { runTailoring } from "./actions";

const STEPS = ["Rewriting your resume for this job", "Running the honesty guard", "Scoring it like their screener"];

export function TailorForm({ pack, answers }: { pack: RolePack; answers: Answers }) {
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  // Same deterministic matcher the server uses, run on every keystroke.
  const deferredJd = useDeferredValue(jd);
  const match = useMemo(() => matchJd(deferredJd, pack, answers), [deferredJd, pack, answers]);
  const detected = match.matched.length + match.gaps.length;

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 25000);
    return () => clearInterval(t);
  }, [pending]);

  function submit() {
    setError(undefined);
    setStep(0);
    startTransition(async () => {
      const result = await runTailoring({ jd, company, roleTitle });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            className="rounded-lg border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Role title (optional)"
            className="rounded-lg border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={20}
          placeholder="Paste the full job description here…"
          className="w-full rounded-lg border border-line bg-card p-4 text-sm outline-none focus:border-ink"
        />
        <div className="flex items-center gap-4">
          <button
            onClick={submit}
            disabled={pending || jd.trim().length < 200}
            className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Working…" : "Tailor my resume"}
          </button>
          {pending && <span className="text-sm text-muted">{STEPS[step]}… (usually under a minute)</span>}
          {error && <span className="text-sm text-bad">{error}</span>}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-line bg-card p-5 lg:sticky lg:top-6">
        <div className="text-sm text-muted">Live match</div>
        {detected === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Skills from the {pack.title} pack will appear here as you paste.
          </p>
        ) : (
          <>
            <div className="mt-1 font-serif text-4xl font-semibold">{match.coveragePct}%</div>
            <div className="text-sm text-muted">of the {detected} skills this job asks for</div>
            <SkillList title="You have" skills={match.matched} tone="bg-accent-soft text-accent" />
            <SkillList title="Gaps (won't be claimed)" skills={match.gaps} tone="bg-warn-soft text-warn" />
          </>
        )}
      </aside>
    </div>
  );
}

function SkillList({ title, skills, tone }: { title: string; skills: RolePack["skills"]; tone: string }) {
  if (!skills.length) return null;
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <li key={s.id} className={`rounded-full px-2.5 py-0.5 text-xs ${tone}`}>
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
