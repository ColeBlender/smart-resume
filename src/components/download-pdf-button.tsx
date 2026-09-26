"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resumeFileName } from "@/lib/resume-file-name";

export function DownloadPdfButton({
  markdown,
  company,
  title,
  size = "default",
  showFileName = false,
}: {
  markdown: string;
  company: string | null;
  title?: string | null;
  size?: "default" | "lg" | "xl";
  showFileName?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const fileName = resumeFileName(markdown, company, title);

  async function download() {
    setBusy(true);
    try {
      const { downloadResumePdf } = await import("@/lib/resume-pdf");
      await downloadResumePdf(markdown, company, title);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button size={size} onClick={download} disabled={busy}>
        <Download /> Download PDF
      </Button>
      {showFileName && <span className="font-mono text-xs text-muted-foreground">{fileName}</span>}
    </div>
  );
}
