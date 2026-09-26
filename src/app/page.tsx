import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PACKS } from "@/lib/role-packs";

export default async function Home({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  const postings = ROLE_PACKS.reduce((n, p) => n + p.postings_sampled, 0);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">For software engineers</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          Tailor your resume to any job. Never invent a skill.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Confirm what you actually know once. Paste a job description. Get a resume rewritten for that
          role, a match score, and the exact gaps. The honesty guard strips any skill you never confirmed.
        </p>
        <div className="mt-8">
          <GoogleButton />
          {error && <p className="mt-3 text-sm text-bad">Sign-in failed. Please try again.</p>}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            ["1. Confirm your skills", `Pick your role. Answer yes, some, or no to the skills real postings ask for (${postings} postings analyzed).`],
            ["2. Paste a job", "We detect the skills it wants, score your coverage, and show what you're missing."],
            ["3. Get an honest resume", "Claude rewrites it for the job, a screener scores it, and the guard removes anything unbacked."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-line bg-card p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
