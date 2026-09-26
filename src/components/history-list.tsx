import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { DownloadPdfButton } from "./download-pdf-button";

export type HistoryRow = {
  id: string;
  company: string | null;
  role_title: string | null;
  result_md: string;
  created_at: string;
};

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My resumes</CardTitle>
        <CardDescription>Every resume you&apos;ve tailored, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <ItemGroup className="gap-2">
            {rows.map((t) => (
              <Item key={t.id} variant="outline">
                <ItemMedia variant="icon">
                  <FileText />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{t.role_title || "Tailored resume"}</ItemTitle>
                  <ItemDescription>
                    {t.company || "Unknown company"} · {new Date(t.created_at).toLocaleDateString()}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DownloadPdfButton markdown={t.result_md} company={t.company} title={t.role_title} />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No resumes yet</EmptyTitle>
              <EmptyDescription>Paste a job description on the Tailor page to make your first one.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
