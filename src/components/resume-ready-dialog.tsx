"use client";

import { ArrowRight, CircleCheck, Download } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreRing } from "./score-ring";

export type ReadyResume = {
  id: string;
  title: string;
  company: string | null;
  score: number;
  coverage: number;
  flagged: number;
  markdown: string;
};

export function downloadMarkdown(markdown: string, name: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The finish line: big, centered, impossible to miss. */
export function ResumeReadyDialog(props: {
  resume: ReadyResume | null;
  href: string;
  onClose: () => void;
}) {
  const r = props.resume;
  return (
    <Dialog open={!!r} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-xl">
        {r && (
          <>
            <DialogHeader className="items-center text-center">
              <CircleCheck className="mb-2 size-14 text-success" />
              <DialogTitle className="text-3xl">Your resume is ready</DialogTitle>
              <DialogDescription className="text-base">
                Tailored for {r.title}
                {r.company ? ` at ${r.company}` : ""}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center gap-10 py-4">
              <ScoreRing value={r.score} label="Screener score" />
              <ScoreRing value={r.coverage} label="Skill coverage" />
            </div>
            <div className="flex justify-center">
              {r.flagged > 0 ? (
                <Badge variant="destructive">Honesty guard flagged {r.flagged} skill{r.flagged === 1 ? "" : "s"}: review before sending</Badge>
              ) : (
                <Badge variant="secondary">Honesty guard passed: nothing invented</Badge>
              )}
            </div>

            <DialogFooter className="mt-4 sm:justify-center">
              <Button variant="outline" size="lg" onClick={() => downloadMarkdown(r.markdown, `${r.company ?? "resume"}-${r.title}`)}>
                <Download /> Download
              </Button>
              <Button size="lg" asChild>
                <Link href={props.href}>
                  Open my resume <ArrowRight />
                </Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
