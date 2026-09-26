// Fake data for /preview. Nothing here touches Supabase or Claude.
import type { Prefill } from "@/app/(app)/onboard/actions";
import type { HistoryRow } from "@/components/history-list";
import type { JobAnalysis } from "@/lib/claude";
import type { JobSkill, Role, UserSkill } from "@/lib/scoring";

export const PREVIEW_USER = { email: "jane@example.com", user_metadata: { full_name: "Jane Doe" } };

export const RESUME = `# Jane Doe
Senior Software Engineer · jane@example.com

## Experience
### Acme Payments (2021 to present), Senior Software Engineer
- Built a React + TypeScript merchant dashboard used by 4,000 businesses.
- Designed REST APIs in Node.js handling 2M requests/day.
- Cut p95 page load from 3.1s to 1.2s by moving data fetching to the server.

### Brightside Health (2018 to 2021), Software Engineer
- Shipped patient scheduling features in React.
- Wrote PostgreSQL queries and migrations for the appointments service.

## Education
B.S. Computer Science, State University`;

export const JD = `Senior Full-stack Engineer at Northwind

You will build customer-facing features across our React/TypeScript frontend and Node.js services.

Requirements: 5+ years building web apps, strong TypeScript and React, REST API design, PostgreSQL, Kafka, Docker and Kubernetes, AWS, CI/CD. GraphQL a plus. You care about performance and ship iteratively with product and design.`;

export const ROLES: Role[] = [
  { company: "Acme Payments", title: "Senior Software Engineer", dates: "2021 to present" },
  { company: "Brightside Health", title: "Software Engineer", dates: "2018 to 2021" },
];

export const PREFILL: Prefill[] = [
  { key: "git", rating: null, evidence: null },
  { key: "react", rating: 4, evidence: "Built a React + TypeScript merchant dashboard used by 4,000 businesses." },
  { key: "rest-apis", rating: 4, evidence: "Designed REST APIs in Node.js handling 2M requests/day." },
  { key: "typescript", rating: 4, evidence: "React + TypeScript merchant dashboard" },
  { key: "postgresql", rating: 3, evidence: "Wrote PostgreSQL queries and migrations for the appointments service." },
];

export const ANALYSIS: JobAnalysis = {
  company: "Northwind",
  role_title: "Senior Full-stack Engineer",
  skills: [
    { name: "TypeScript", required: true },
    { name: "React", required: true },
    { name: "Kafka", required: true },
    { name: "Kubernetes", required: true },
    { name: "GraphQL", required: false },
  ],
};

export const UNKNOWN: JobSkill[] = [
  { key: "x-kafka", name: "Kafka", weight: 4, aliases: [] },
  { key: "kubernetes", name: "Kubernetes", weight: 3, aliases: ["K8s"] },
  { key: "graphql", name: "GraphQL", weight: 2, aliases: [] },
];

export const TAILORED = `# Jane Doe

Senior Full-stack Engineer · React, TypeScript and Node.js · jane@example.com

## Summary
Senior engineer with 8 years building customer-facing web products end to end, from React and TypeScript frontends to Node.js REST services on PostgreSQL. Known for measurable performance wins.

## Skills
TypeScript, React, Node.js, REST API design, PostgreSQL, Kafka, Git

## Experience
### Acme Payments (2021 to present), Senior Software Engineer
- Built a customer-facing React and TypeScript merchant dashboard used by 4,000 businesses.
- Designed REST APIs in Node.js handling 2M requests/day.
- Cut p95 page load from 3.1s to 1.2s by moving data fetching to the server.
- Ran the event pipeline on Kafka, processing order and payout events.

### Brightside Health (2018 to 2021), Software Engineer
- Shipped patient scheduling features in React.
- Wrote PostgreSQL queries and migrations for the appointments service.

## Education
B.S. Computer Science, State University`;

export const HISTORY: HistoryRow[] = [
  { id: "demo-1", company: "Northwind", role_title: "Senior Full-stack Engineer", result_md: TAILORED, created_at: "2026-09-26T18:04:00Z" },
  { id: "demo-2", company: "Globex", role_title: "Staff Frontend Engineer", result_md: TAILORED, created_at: "2026-09-25T15:30:00Z" },
  { id: "demo-3", company: null, role_title: "Backend Engineer (Payments)", result_md: TAILORED, created_at: "2026-09-24T09:12:00Z" },
];

export const SKILLS: UserSkill[] = [
  { key: "typescript", name: "TypeScript", rating: 5, usedAt: [{ role: "Acme Payments · Senior Software Engineer", what: "Primary language for the merchant dashboard and the Node services behind it." }, { role: "Brightside Health · Software Engineer", what: "Migrated the scheduling app from JavaScript to TypeScript." }] },
  { key: "react", name: "React", rating: 4, note: null },
  { key: "rest-apis", name: "REST API Design", rating: 4, usedAt: [{ role: "Acme Payments · Senior Software Engineer", what: "" }] },
  { key: "postgresql", name: "PostgreSQL", rating: 3, note: null },
  { key: "x-kafka", name: "Kafka", rating: 3, usedAt: [{ role: "Acme Payments · Senior Software Engineer", what: "Ran our order and payout event pipeline on Kafka, about 2M events a day." }] },
  { key: "kubernetes", name: "Kubernetes", rating: 2, note: null },
  { key: "graphql", name: "GraphQL", rating: 1, note: null },
];
