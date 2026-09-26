"use client";

import { PencilLine, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { CLAIMABLE, type Rating, type Role, type SkillUse, type UserSkill } from "@/lib/scoring";
import { RatingLegend, RatingPicker } from "./wizard/rating-picker";
import { SkillContextFields } from "./wizard/skill-context-fields";

export type SkillsActions = {
  updateSkill: (s: {
    key: string;
    name: string;
    rating: number;
    note?: string | null;
    usedAt?: SkillUse[];
  }) => Promise<{ ok: true } | { error: string }>;
};

export function SkillsView({
  initial,
  actions,
  baseResume,
  roles,
}: {
  initial: UserSkill[];
  roles: Role[];
  actions: SkillsActions;
  baseResume: string;
}) {
  const [skills, setSkills] = useState(() => [...initial].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)));
  const [editing, setEditing] = useState<UserSkill | null>(null);
  const [draftUsedAt, setDraftUsedAt] = useState<SkillUse[]>([]);

  async function save(next: UserSkill) {
    setSkills((cur) => cur.map((s) => (s.key === next.key ? next : s)));
    const result = await actions.updateSkill(next);
    if ("error" in result) toast.error(result.error);
  }

  const claimable = skills.filter((s) => s.rating >= CLAIMABLE).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Your baseline resume and everything you&apos;ve told us about your skills.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/onboard?redo=1">
            <RotateCcw /> Update resume &amp; redo setup
          </Link>
        </Button>
      </div>

      <Card>
        <Collapsible>
          <CardHeader>
            <CardTitle>Baseline resume</CardTitle>
            <CardDescription>Every tailored resume is built from this. {baseResume.length.toLocaleString()} characters.</CardDescription>
            <CardAction>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  Show
                </Button>
              </CollapsibleTrigger>
            </CardAction>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <pre className="font-mono text-xs whitespace-pre-wrap text-muted-foreground">{baseResume}</pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            {skills.length} skills · {claimable} can go on a resume (rated 3+). This grows every time a job asks
            about something new.
          </CardDescription>
          <RatingLegend />
        </CardHeader>
        <CardContent>
          {skills.length ? (
            <ItemGroup className="gap-2">
              {skills.map((s) => (
                <Item key={s.key} variant="outline">
                  <ItemContent className="min-w-56">
                    <ItemTitle>
                      {s.name}
                      {s.rating < CLAIMABLE && <Badge variant="outline">Not claimed</Badge>}
                    </ItemTitle>
                    <ItemDescription>
                      {s.usedAt?.length
                        ? s.usedAt.map((u) => (u.what ? `${u.role.split(" · ")[0]}: ${u.what}` : u.role.split(" · ")[0])).join(" · ")
                        : s.note || "Not placed in a job yet. Tap the pencil to add where you used it."}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit where you used ${s.name}`}
                      onClick={() => {
                        setEditing(s);
                        setDraftUsedAt(s.usedAt ?? []);
                      }}
                    >
                      <PencilLine />
                    </Button>
                    <RatingPicker value={s.rating} onChange={(r: Rating) => save({ ...s, rating: r })} />
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No skills yet</EmptyTitle>
                <EmptyDescription>Finish setup or paste a job description and we&apos;ll ask as we go.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.name} in context</DialogTitle>
            <DialogDescription>Where you used it and what you did. Claude writes it into that job on your resumes.</DialogDescription>
          </DialogHeader>
          {editing && (
            <SkillContextFields
              idPrefix={`edit-${editing.key}`}
              skillName={editing.name}
              roles={roles}
              uses={draftUsedAt}
              onChange={setDraftUsedAt}
            />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editing) save({ ...editing, usedAt: draftUsedAt });
                setEditing(null);
                toast.success("Saved");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
