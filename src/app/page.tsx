import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { Header } from "@/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_PACKS } from "@/lib/role-packs";
import { createClient } from "@/lib/supabase/server";

export default async function Home({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  const postings = ROLE_PACKS.reduce((n, p) => n + p.postings_sampled, 0);

  const steps = [
    {
      icon: ClipboardCheck,
      title: "Confirm your skills",
      body: `Pick a role and answer yes, some, or no to the skills ${postings} real job postings ask for.`,
    },
    {
      icon: FileSearch,
      title: "Paste a job",
      body: "See which skills it wants, your weighted coverage, and your gaps, live as you paste.",
    },
    {
      icon: ShieldCheck,
      title: "Get an honest resume",
      body: "Claude rewrites it for the role, a screener scores it, and the honesty guard strips anything unbacked.",
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-accent),transparent_60%)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
            <Badge variant="secondary" className="mb-6">
              Built for software engineers
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Tailor your resume to any job.{" "}
              <span className="text-brand">Never invent a skill.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-balance text-muted-foreground">
              Confirm what you actually know once. Every tailored resume is fenced to that list, and you see
              your match score and exact gaps before you apply.
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
          {steps.map(({ icon: Icon, title, body }, i) => (
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
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <a href="/privacy" className="hover:text-foreground">
          Privacy
        </a>
      </footer>
    </>
  );
}
