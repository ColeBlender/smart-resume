import { AlertTriangle, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { ScoreRing } from "@/components/score-ring";
import { SkillChips } from "@/components/skill-chips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { requireProfile } from "@/lib/profile";
import { weightedCoverage } from "@/lib/scoring";

export default async function Dashboard() {
  const { supabase, user, pack, answers } = await requireProfile();

  const { data: tailorings } = await supabase
    .from("tailorings")
    .select("id, company, role_title, ai_score, coverage_pct, flagged, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const coverage = weightedCoverage(pack.skills, answers);
  // Heaviest skills the user said no to (or skipped): what to learn next for this role.
  const toLearn = pack.skills.filter((s) => (answers[s.id] ?? "no") === "no").slice(0, 6);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Targeting</p>
            <h1 className="text-3xl font-bold tracking-tight">{pack.title}</h1>
          </div>
          <Button asChild size="lg">
            <Link href="/tailor/new">
              <Plus /> Tailor for a new job
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Role coverage</CardTitle>
              <CardDescription>Weighted by how often {pack.postings_sampled} real postings ask for each skill.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreRing value={coverage} />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Highest-value skills you don&apos;t have yet</CardTitle>
              <CardDescription>The most-requested skills in this role that you answered no to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {toLearn.length ? (
                <SkillChips skills={toLearn} tone="gap" />
              ) : (
                <p className="text-sm text-muted-foreground">You cover every skill in this role pack.</p>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/onboard">Update skills or resume</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tailored resumes</CardTitle>
            <CardDescription>Every resume you&apos;ve generated, newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {tailorings?.length ? (
              <ItemGroup className="gap-2">
                {tailorings.map((t) => (
                  <Item key={t.id} variant="outline" asChild>
                    <Link href={`/tailor/${t.id}`}>
                      <ItemContent>
                        <ItemTitle>{t.role_title || "Untitled role"}</ItemTitle>
                        <ItemDescription>
                          {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleDateString()}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        {(t.flagged as unknown[]).length > 0 && (
                          <Badge variant="destructive">
                            <AlertTriangle /> Review
                          </Badge>
                        )}
                        <Badge variant="secondary">Screener {t.ai_score ?? "–"}</Badge>
                        <Badge variant="outline">Coverage {t.coverage_pct}%</Badge>
                      </ItemActions>
                    </Link>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>No tailored resumes yet</EmptyTitle>
                  <EmptyDescription>Paste a job description to make your first one.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild>
                    <Link href="/tailor/new">
                      <Plus /> Tailor for a new job
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
