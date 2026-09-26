"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RolePack } from "@/lib/role-packs";
import { weightedCoverage, type Answer, type Answers } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { saveProfile } from "./actions";

const OPTIONS: { value: Answer; label: string; on: string }[] = [
  { value: "yes", label: "Yes", on: "data-[state=on]:bg-success data-[state=on]:text-white" },
  { value: "some", label: "Some", on: "data-[state=on]:bg-warning data-[state=on]:text-white" },
  { value: "no", label: "No", on: "data-[state=on]:bg-muted-foreground data-[state=on]:text-background" },
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
    startTransition(async () => {
      const result = await saveProfile({ rolePackId: packId, baseResume: resume, answers });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. What role are you going for?</CardTitle>
          <CardDescription>
            {pack.summary} Skills and weights come from {pack.postings_sampled} real postings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {props.packs.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={p.id === packId ? "default" : "outline"}
              onClick={() => setPackId(p.id)}
              className="justify-start"
            >
              {p.title}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Which of these have you actually used?</CardTitle>
          <CardDescription>
            {answered}/{pack.skills.length} answered · {coverage}% weighted role coverage
          </CardDescription>
          <Progress value={coverage} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {byCategory.map(([category, skills]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">{category}</h3>
              <ItemGroup className="gap-2">
                {skills.map((s) => (
                  <Item key={s.id} variant="outline">
                    <ItemContent className="min-w-60">
                      <ItemTitle>
                        {s.name}
                        <span className="text-xs font-normal text-muted-foreground">{s.frequency_pct}% of postings</span>
                      </ItemTitle>
                      <ItemDescription>{s.question}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        spacing={0}
                        value={answers[s.id] ?? ""}
                        onValueChange={(v) => v && setAnswers((a) => ({ ...a, [s.id]: v as Answer }))}
                      >
                        {OPTIONS.map((o) => (
                          <ToggleGroupItem key={o.value} value={o.value} className={cn("px-3", o.on)}>
                            {o.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Paste your current resume</CardTitle>
          <CardDescription>Plain text or Markdown. This is the only source of facts Claude may use.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={14}
            placeholder={"Jane Doe\nSenior Software Engineer\n\nExperience\nAcme Corp (2021 to present)\n- Built…"}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={submit} disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
