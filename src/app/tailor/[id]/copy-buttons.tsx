"use client";

import { useState } from "react";

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
    <div className="flex gap-2">
      <button onClick={copy} className="flex-1 rounded-md border border-line bg-card px-4 py-2 text-sm hover:border-ink">
        {copied ? "Copied" : "Copy Markdown"}
      </button>
      <button onClick={download} className="flex-1 rounded-md border border-line bg-card px-4 py-2 text-sm hover:border-ink">
        Download .md
      </button>
      <button onClick={() => window.print()} className="flex-1 rounded-md border border-line bg-card px-4 py-2 text-sm hover:border-ink">
        Print / PDF
      </button>
    </div>
  );
}
