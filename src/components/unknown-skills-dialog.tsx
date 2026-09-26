"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CLAIMABLE, RATING_LABELS, type JobSkill, type Rating } from "@/lib/scoring";
import { RatingPicker } from "./wizard/rating-picker";

export type SkillEntry = { key: string; name: string; rating: number; note?: string | null };

/** "This job asks about things we don't know about you yet": one skill per step. */
export function UnknownSkillsDialog(props: {
  open: boolean;
  skills: JobSkill[];
  onDone: (entries: SkillEntry[]) => void;
  onCancel: () => void;
  initialIndex?: number;
  initialRatings?: Record<string, Rating>;
}) {
  const [index, setIndex] = useState(props.initialIndex ?? 0);
  const [ratings, setRatings] = useState<Record<string, Rating>>(props.initialRatings ?? {});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const skill = props.skills[index];
  if (!skill) return null;
  const rating = ratings[skill.key];
  const last = index === props.skills.length - 1;

  function next() {
    if (!last) return setIndex(index + 1);
    props.onDone(
      props.skills
        .filter((s) => ratings[s.key])
        .map((s) => ({ key: s.key, name: s.name, rating: ratings[s.key], note: notes[s.key] })),
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" /> This job asks about {props.skills.length} thing
              {props.skills.length === 1 ? "" : "s"} we don&apos;t know about you yet · {index + 1} of{" "}
              {props.skills.length}
            </div>
            <Progress value={((index + 1) / props.skills.length) * 100} />
          </div>
          <DialogTitle className="text-xl">How&apos;s your {skill.name}?</DialogTitle>
          <DialogDescription>
            Your answer is saved to your profile, so we&apos;ll never ask about {skill.name} again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Field>
            <FieldLabel>Rate yourself</FieldLabel>
            <RatingPicker value={rating} onChange={(r) => setRatings((cur) => ({ ...cur, [skill.key]: r }))} />
            <FieldDescription>{rating ? RATING_LABELS[rating] : "1 never used · 3 used at work · 5 expert"}</FieldDescription>
          </Field>

          {rating && rating >= CLAIMABLE && (
            <Field>
              <FieldLabel htmlFor={`note-${skill.key}`}>What have you done with it? (optional)</FieldLabel>
              <Textarea
                id={`note-${skill.key}`}
                rows={3}
                value={notes[skill.key] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [skill.key]: e.target.value }))}
                placeholder={`e.g. "Ran our event pipeline on ${skill.name} at Acme, ~2M events/day."`}
              />
              <FieldDescription>Claude can use this as a fact on your resume. It never embellishes it.</FieldDescription>
            </Field>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>
            <ArrowLeft /> Back
          </Button>
          <Button onClick={next} disabled={!rating}>
            {last ? "Tailor my resume" : "Next"} <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
