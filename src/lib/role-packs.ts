import aiEngineer from "../../data/role-packs/ai-engineer.json";
import backend from "../../data/role-packs/backend.json";
import devops from "../../data/role-packs/devops.json";
import frontend from "../../data/role-packs/frontend.json";
import fullstack from "../../data/role-packs/fullstack.json";
import mobile from "../../data/role-packs/mobile.json";

export type Skill = {
  id: string;
  name: string;
  category: string;
  /** 1-5, bucketed from how often real postings list it (5 = in 70%+). */
  weight: number;
  frequency_pct: number;
  aliases: string[];
  question: string;
};

export type RolePack = {
  id: string;
  title: string;
  summary: string;
  postings_sampled: number;
  skills: Skill[];
  ats_keywords: string[];
  sources: string[];
};

export const ROLE_PACKS: RolePack[] = [fullstack, frontend, backend, aiEngineer, mobile, devops];

export function getPack(id: string | null | undefined): RolePack | undefined {
  return ROLE_PACKS.find((p) => p.id === id);
}
