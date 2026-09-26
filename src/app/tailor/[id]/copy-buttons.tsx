"use client";

import { Check, Copy, Download, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButtons({ markdown, filename }: { markdown: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
