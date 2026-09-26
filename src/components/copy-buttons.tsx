"use client";

import { Check, Copy, Download, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadMarkdown } from "./resume-ready-dialog";

export function CopyButtons({ markdown, filename }: { markdown: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const download = () => downloadMarkdown(markdown, filename);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" onClick={download}>
        <Download /> .md
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer /> PDF
      </Button>
    </div>
  );
}
