import type { SkillUse } from "./scoring";

/** Bound and trim user-supplied skill uses before they're stored. */
export function cleanUses(uses: SkillUse[] | undefined): SkillUse[] {
  return (uses ?? [])
    .filter((u) => typeof u?.role === "string" && u.role.trim())
    .slice(0, 10)
    .map((u) => ({ role: u.role.trim().slice(0, 120), what: (u.what ?? "").trim().slice(0, 800) }));
}
