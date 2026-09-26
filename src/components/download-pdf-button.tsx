"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { resumeFileName } from "@/lib/resume-file-name";

export function DownloadPdfButton({
  markdown,
  company,
  size = "default",
  showFileName = false,
}: {
  markdown: string;
  company: string | null;
  size?: "default" | "lg" | "xl";
  showFileName?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const fileName = resumeFileName(markdown, company);

  async function download() {
    setBusy(true);
    try {
      const { downloadResumePdf } = await import("@/lib/resume-pdf");
      await downloadResumePdf(markdown, company);
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
        {busy ? <Spinner /> : <Download />} Download PDF
      </Button>
      {showFileName && <span className="font-mono text-xs text-muted-foreground">{fileName}</span>}
    </div>
  );
}
