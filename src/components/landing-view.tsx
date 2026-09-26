import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_PACKS } from "@/lib/role-packs";

const postings = ROLE_PACKS.reduce((n, p) => n + p.postings_sampled, 0);

const STEPS = [
  { icon: FileSearch, title: "Paste your resume", body: "Upload or paste the resume you already have. That's your baseline." },
  {
    icon: ClipboardCheck,
    title: "Confirm your skills",
    body: `Claude pre-rates you from your resume against what ${postings} real postings ask for. You just adjust.`,
  },
  {
    icon: ShieldCheck,
    title: "Paste any job",
    body: "Get a tailored resume as a PDF in about a minute. Nothing you haven't confirmed ever makes it in.",
  },
];

export function LandingView({ error }: { error?: boolean }) {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-accent),transparent_60%)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
            <Badge variant="secondary" className="mb-6">
              Built for software engineers
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Tailor your resume to any job. <span className="text-brand">Never invent a skill.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-balance text-muted-foreground">
              Confirm what you actually know once. Every tailored resume is fenced to that list, and the profile
              learns more about you with every job you paste.
            </p>
            <div className="mt-10">
              <GoogleButton />
            </div>
            {error && (
              <Alert variant="destructive" className="mt-6 max-w-sm">
                <AlertDescription>Sign-in failed. Please try again.</AlertDescription>
              </Alert>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Card key={title}>
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </div>
                <CardTitle>
                  {i + 1}. {title}
                </CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
      <footer className="flex justify-center border-t py-4">
        <Button variant="link" size="sm" asChild>
          <Link href="/privacy">Privacy</Link>
        </Button>
      </footer>
    </>
  );
}
