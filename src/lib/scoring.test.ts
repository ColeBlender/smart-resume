import { describe, expect, it } from "vitest";
import type { Skill } from "./role-packs";
import {
  collectJobSkills,
  findUnbackedClaims,
  matchJob,
  mentions,
  resolveSkillKey,
  strengthsNeedingNotes,
  weightedCoverage,
  type SkillProfile,
} from "./scoring";

const skill = (id: string, name: string, weight: number, aliases: string[] = []): Skill => ({
  id,
  name,
  category: "Languages",
  weight,
  frequency_pct: 0,
  aliases,
  question: "",
});

const packSkills = [
  skill("typescript", "TypeScript", 5, ["TS"]),
  skill("go", "Go", 3, ["Golang"]),
  skill("cpp", "C++", 2),
  skill("ci-cd", "CI/CD", 4, ["continuous integration"]),
];

const profile = (entries: Record<string, 1 | 2 | 3 | 4 | 5>): SkillProfile =>
  Object.fromEntries(Object.entries(entries).map(([key, rating]) => [key, { key, name: key, rating }]));

describe("mentions", () => {
  it("matches tokens with punctuation", () => {
    expect(mentions("Built C++ services", "C++")).toBe(true);
    expect(mentions("Owned the CI/CD pipeline", "CI/CD")).toBe(true);
  });
  it("doesn't match inside other words", () => {
    expect(mentions("JavaScript", "Java")).toBe(false);
  });
  it("is case-sensitive for short terms only", () => {
    expect(mentions("ready to go live", "Go")).toBe(false);
    expect(mentions("services in Go", "Go")).toBe(true);
    expect(mentions("strong typescript skills", "TypeScript")).toBe(true);
  });
});

describe("weightedCoverage", () => {
  it("credits ratings linearly from 1 (0%) to 5 (100%)", () => {
    // typescript 5 -> 1.0*5, go 3 -> 0.5*3, others unknown -> 0. 6.5 / 14
    const skills = packSkills.map((s) => ({ key: s.id, weight: s.weight }));
    expect(weightedCoverage(skills, profile({ typescript: 5, go: 3 }))).toBe(46);
  });
  it("is 0 for no skills", () => {
    expect(weightedCoverage([], {})).toBe(0);
  });
});

describe("resolveSkillKey", () => {
  it("maps names and aliases onto pack ids", () => {
    expect(resolveSkillKey("golang", packSkills, {})).toBe("go");
    expect(resolveSkillKey("Continuous Integration", packSkills, {})).toBe("ci-cd");
  });
  it("reuses a custom skill the user already rated", () => {
    const p: SkillProfile = { "x-kafka": { key: "x-kafka", name: "Kafka", rating: 4 } };
    expect(resolveSkillKey("kafka", packSkills, p)).toBe("x-kafka");
  });
  it("treats wording variants as the same skill", () => {
    const pack = [skill("rest-apis", "REST APIs", 5), skill("ci-cd", "CI/CD Pipelines", 4)];
    expect(resolveSkillKey("REST API design", pack, {})).toBe("rest-apis");
    expect(resolveSkillKey("CI/CD", pack, {})).toBe("ci-cd");
  });
  it("mints a custom key for anything new", () => {
    expect(resolveSkillKey("Apache Kafka", packSkills, {})).toBe("x-apache-kafka");
  });
});

describe("collectJobSkills + matchJob", () => {
  const jd = "We need TypeScript and Golang engineers. Kafka required, Terraform nice to have.";
  const extracted = [
    { name: "TypeScript", required: true },
    { name: "Kafka", required: true },
    { name: "Terraform", required: false },
  ];

  it("merges pack matches with extracted skills, heaviest first", () => {
    const skills = collectJobSkills(jd, extracted, packSkills, packSkills, {});
    expect(skills.map((s) => [s.key, s.weight])).toEqual([
      ["typescript", 5],
      ["x-kafka", 4],
      ["go", 3],
      ["x-terraform", 2],
    ]);
  });

  it("splits matched, gaps and unknown", () => {
    const skills = collectJobSkills(jd, extracted, packSkills, packSkills, {});
    const m = matchJob(skills, profile({ typescript: 4, go: 2 }));
    expect(m.matched.map((s) => s.key)).toEqual(["typescript"]);
    expect(m.gaps.map((s) => s.key)).toEqual(["go"]);
    expect(m.unknown.map((s) => s.key)).toEqual(["x-kafka", "x-terraform"]);
  });
});

describe("findUnbackedClaims", () => {
  it("flags skills rated below 3 or never rated, unless the base resume has them", () => {
    const flagged = findUnbackedClaims(
      "Shipped TypeScript, Go and C++ services.",
      "Some C++ in school.",
      packSkills.map((s) => ({ key: s.id, name: s.name, aliases: s.aliases })),
      profile({ typescript: 4, go: 2 }),
    );
    expect(flagged.map((s) => s.key)).toEqual(["go"]);
  });
});

describe("strengthsNeedingNotes", () => {
  it("picks strong skills with no note and no evidence in the resume", () => {
    const picked = strengthsNeedingNotes(packSkills, profile({ typescript: 5, "ci-cd": 4, go: 5 }), "Wrote Go daily.");
    expect(picked.map((s) => s.id)).toEqual(["typescript", "ci-cd"]);
  });
});
