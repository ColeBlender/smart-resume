"use client";

import { PencilLine, Replace } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
import { ResumeInput, type ExtractResume } from "./resume-input";
import { SkillContextFields } from "./wizard/skill-context-fields";

export type SkillsActions = {
  updateSkill: (s: {
    key: string;
    name: string;
    rating: number;
    note?: string | null;
    usedAt?: SkillUse[];
  }) => Promise<{ ok: true } | { error: string }>;
  replaceResume: (resume: string) => Promise<{ ok: true } | { error: string }>;
  extractResume: ExtractResume;
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
  const router = useRouter();
  const [resume, setResume] = useState(baseResume);
  const [replacing, setReplacing] = useState(false);
  const [newResume, setNewResume] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, startSaving] = useTransition();

  function saveResume() {
    startSaving(async () => {
      const result = await actions.replaceResume(newResume);
      if ("error" in result) return void toast.error(result.error);
      setResume(newResume.trim());
      setReplacing(false);
      toast.success("Resume replaced. Your skills and answers are unchanged.");
      router.refresh();
    });
  }

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
      </div>

      <Card>
        <Collapsible>
          <CardHeader>
            <CardTitle>Baseline resume</CardTitle>
            <CardDescription>Every tailored resume is built from this. {resume.length.toLocaleString()} characters.</CardDescription>
            <CardAction className="flex gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  Show
                </Button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                onClick={() => {
                  setNewResume("");
                  setReplacing(true);
                }}
              >
                <Replace /> Replace
              </Button>
            </CardAction>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-4">
              <pre className="font-mono text-xs whitespace-pre-wrap text-muted-foreground">{resume}</pre>
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

      <Dialog open={replacing} onOpenChange={(open) => !saving && setReplacing(open)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Replace your resume</DialogTitle>
            <DialogDescription>
              Upload or paste your latest version. Your skill ratings and answers stay; we just re-read your job
              history.
            </DialogDescription>
          </DialogHeader>
          <ResumeInput value={newResume} onChange={setNewResume} extractResume={actions.extractResume} onBusyChange={setReading} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplacing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveResume} disabled={saving || reading || newResume.trim().length < 200}>
              {saving && <Spinner />} {saving ? "Reading your jobs…" : "Save resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
