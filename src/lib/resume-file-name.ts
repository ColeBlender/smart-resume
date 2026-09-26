/** "Jane-Doe-Resume-Northwind.pdf": name from the resume's H1, company from the job. */
export function resumeFileName(markdown: string, company: string | null): string {
  const name = markdown.match(/^#\s+(.+)$/m)?.[1] ?? "Resume";
  const slug = (v: string) => v.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return [slug(name), "Resume", company ? slug(company) : null].filter(Boolean).join("-") + ".pdf";
}
