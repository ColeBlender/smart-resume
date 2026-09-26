import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Skill } from "@/lib/role-packs";

const TONES = {
  match: "border-success/30 bg-success/10 text-success",
  gap: "border-warning/30 bg-warning/10 text-warning",
  flag: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export function SkillChips({ skills, tone }: { skills: Skill[]; tone: keyof typeof TONES }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <Badge key={s.id} variant="outline" className={cn(TONES[tone])}>
          {s.name}
        </Badge>
      ))}
    </div>
  );
}
