import { describe, expect, it } from "vitest";
import type { RolePack, Skill } from "./role-packs";
import {
  extractJdSkills,
  findUnbackedClaims,
  matchJd,
  mentions,
  weightedCoverage,
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

const pack: RolePack = {
  id: "test",
  title: "Test",
  summary: "",
  postings_sampled: 0,
  ats_keywords: [],
  sources: [],
  skills: [
    skill("typescript", "TypeScript", 5, ["TS"]),
    skill("go", "Go", 3, ["Golang"]),
    skill("cpp", "C++", 2),
    skill("ci-cd", "CI/CD", 4, ["continuous integration"]),
  ],
};

describe("mentions", () => {
  it("matches tokens with punctuation", () => {
    expect(mentions("Built C++ services", "C++")).toBe(true);
    expect(mentions("Owned the CI/CD pipeline", "CI/CD")).toBe(true);
  });
  it("doesn't match inside other words", () => {
    expect(mentions("JavaScript", "Java")).toBe(false);
  });
  it("is case-sensitive for short terms", () => {
    expect(mentions("ready to go live", "Go")).toBe(false);
    expect(mentions("services in Go", "Go")).toBe(true);
  });
  it("is case-insensitive for longer terms", () => {
    expect(mentions("strong typescript skills", "TypeScript")).toBe(true);
  });
});

describe("weightedCoverage", () => {
  it("weights answers by skill weight", () => {
    // 5*1 + 3*0.5 + 2*0 + 4*0 = 6.5 of 14
    expect(weightedCoverage(pack.skills, { typescript: "yes", go: "some" })).toBe(46);
  });
  it("is 0 for no skills", () => {
    expect(weightedCoverage([], {})).toBe(0);
  });
});

describe("matchJd", () => {
  const jd = "We need TypeScript and Golang engineers who care about continuous integration.";

  it("extracts JD skills heaviest first", () => {
    expect(extractJdSkills(jd, pack).map((s) => s.id)).toEqual(["typescript", "ci-cd", "go"]);
  });

  it("splits matches from gaps", () => {
    const m = matchJd(jd, pack, { typescript: "yes", go: "some", "ci-cd": "no" });
    expect(m.matched.map((s) => s.id)).toEqual(["typescript", "go"]);
    expect(m.gaps.map((s) => s.id)).toEqual(["ci-cd"]);
    // (5 + 1.5) / 12
    expect(m.coveragePct).toBe(54);
  });
});

describe("findUnbackedClaims", () => {
  it("flags skills the user never confirmed and never wrote", () => {
    const flagged = findUnbackedClaims(
      "Shipped TypeScript and C++ services.",
      "Wrote TypeScript.",
      pack,
      {},
    );
    expect(flagged.map((s) => s.id)).toEqual(["cpp"]);
  });
  it("allows skills from the base resume or confirmed answers", () => {
    const flagged = findUnbackedClaims("TypeScript, Go, C++", "Some C++", pack, {
      typescript: "some",
      go: "yes",
    });
    expect(flagged).toEqual([]);
  });
});
