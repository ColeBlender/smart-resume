/**
 * "Jane-Doe-Resume-Northwind.pdf": name from the resume's H1, then the company,
 * or the role title when the posting doesn't name a company.
 */
export function resumeFileName(markdown: string, company: string | null, title?: string | null): string {
  const name = markdown.match(/^#\s+(.+)$/m)?.[1] ?? "Resume";
  const slug = (v: string) => v.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const target = company || title;
  return [slug(name), "Resume", target ? slug(target).slice(0, 60) : null].filter(Boolean).join("-") + ".pdf";
}
