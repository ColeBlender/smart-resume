import { AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";

export type HistoryRow = {
  id: string;
  company: string | null;
  role_title: string | null;
  ai_score: number | null;
  coverage_pct: number;
  flagged: unknown[];
  created_at: string;
};

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your tailored resumes</CardTitle>
        <CardDescription>Newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <ItemGroup className="gap-2">
            {rows.map((t) => (
              <Item key={t.id} variant="outline" asChild>
                <Link href={`/tailor/${t.id}`}>
                  <ItemContent>
                    <ItemTitle>{t.role_title || "Untitled role"}</ItemTitle>
                    <ItemDescription>
                      {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleDateString()}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {t.flagged.length > 0 && (
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
              <EmptyDescription>Paste your first job description above.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
