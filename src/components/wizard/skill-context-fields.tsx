"use client";

import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { roleLabel, SIDE_PROJECT, type Role, type SkillUse } from "@/lib/scoring";

/**
 * "Which jobs did you use it at, and what did you do there?" A skill only means
 * something on a resume inside a job, so each chosen job gets its own
 * open-ended answer, and Claude writes from those answers.
 */
export function SkillContextFields(props: {
  skillName: string;
  roles: Role[];
  uses: SkillUse[];
  onChange: (uses: SkillUse[]) => void;
  idPrefix: string;
}) {
  const options = [...props.roles.map(roleLabel), SIDE_PROJECT];
  const selected = props.uses.map((u) => u.role);

  function pick(labels: string[]) {
    props.onChange(labels.map((role) => props.uses.find((u) => u.role === role) ?? { role, what: "" }));
  }

  function describe(role: string, what: string) {
    props.onChange(props.uses.map((u) => (u.role === role ? { ...u, what } : u)));
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Which jobs did you use {props.skillName} at?</FieldLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          value={selected}
          onValueChange={pick}
          className="flex-wrap justify-start"
        >
          {options.map((o) => (
            <ToggleGroupItem key={o} value={o}>
              {o}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldDescription>Pick every one that applies, then tell us what you did at each.</FieldDescription>
      </Field>

      {props.uses.map((u, i) => {
        const place = u.role === SIDE_PROJECT ? "in your side project" : `at ${u.role.split(" · ")[0]}`;
        return (
          <Field key={u.role}>
            <FieldLabel htmlFor={`${props.idPrefix}-use-${i}`}>
              What did you do with {props.skillName} {place}?
            </FieldLabel>
            <Textarea
              id={`${props.idPrefix}-use-${i}`}
              rows={3}
              value={u.what}
              onChange={(e) => describe(u.role, e.target.value)}
              placeholder={`In your own words: what you built, how big it was, what changed because of it.`}
            />
          </Field>
        );
      })}
      {props.uses.length > 0 && (
        <FieldDescription>
          Claude turns each answer into a bullet under that job. It never adds anything you didn&apos;t say.
        </FieldDescription>
      )}
    </FieldGroup>
  );
}
