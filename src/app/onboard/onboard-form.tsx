"use client";

import { useMemo, useState, useTransition } from "react";
import type { RolePack } from "@/lib/role-packs";
import { weightedCoverage, type Answer, type Answers } from "@/lib/scoring";
import { saveProfile } from "./actions";

const OPTIONS: { value: Answer; label: string; on: string }[] = [
  { value: "yes", label: "Yes", on: "bg-accent text-white border-accent" },
  { value: "some", label: "Some", on: "bg-warn text-white border-warn" },
  { value: "no", label: "No", on: "bg-muted text-white border-muted" },
];

export function OnboardForm(props: {
  packs: RolePack[];
  initialPackId: string;
  initialResume: string;
  initialAnswers: Answers;
}) {
  const [packId, setPackId] = useState(props.initialPackId);
  const [answers, setAnswers] = useState<Answers>(props.initialAnswers);
  const [resume, setResume] = useState(props.initialResume);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const pack = props.packs.find((p) => p.id === packId)!;
  const answered = pack.skills.filter((s) => answers[s.id]).length;
  const coverage = weightedCoverage(pack.skills, answers);

  const byCategory = useMemo(() => {
    const groups = new Map<string, RolePack["skills"]>();
    for (const s of pack.skills) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);
    return [...groups.entries()];
  }, [pack]);

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await saveProfile({ rolePackId: packId, baseResume: resume, answers });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="font-semibold">1. What role are you going for?</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {props.packs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPackId(p.id)}
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                p.id === packId ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          {pack.summary} Skills and weights come from {pack.postings_sampled} real postings.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-semibold">2. Which of these have you actually used?</h2>
          <span className="shrink-0 text-sm text-muted">
            {answered}/{pack.skills.length} answered · {coverage}% role coverage
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent transition-all" style={{ width: `${coverage}%` }} />
        </div>

        {byCategory.map(([category, skills]) => (
          <div key={category} className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{category}</h3>
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-card">
              {skills.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {s.name}
                      <span className="ml-2 text-xs font-normal text-muted">in {s.frequency_pct}% of postings</span>
                    </div>
                    <div className="text-sm text-muted">{s.question}</div>
                  </div>
                  <div className="flex gap-1">
                    {OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [s.id]: o.value }))}
                        className={`rounded border px-3 py-1 text-xs transition ${
                          answers[s.id] === o.value ? o.on : "border-line bg-paper hover:border-ink"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold">3. Paste your current resume</h2>
        <p className="mt-1 text-sm text-muted">Plain text or Markdown. This is the only source of facts Claude may use.</p>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={14}
          placeholder="Jane Doe&#10;Senior Software Engineer&#10;&#10;Experience&#10;Acme Corp (2021 to present)&#10;- Built…"
          className="mt-3 w-full rounded-lg border border-line bg-card p-4 font-mono text-sm outline-none focus:border-ink"
        />
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>
    </div>
  );
}
