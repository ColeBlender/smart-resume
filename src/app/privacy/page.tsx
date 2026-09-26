import { Header } from "@/components/header";

export const metadata = { title: "Privacy · Smart Resume" };

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-12 text-sm leading-relaxed">
        <h1 className="font-serif text-3xl font-semibold">Privacy</h1>
        <p>Smart Resume is a demo project. Here is exactly what it does with your data.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Google sign-in gives us your name and email address. Nothing else from your Google account.</li>
          <li>We store the resume you paste, your skill answers, and the job descriptions and tailored resumes you create, in a Supabase database. Row-level security means only your account can read them.</li>
          <li>Your resume and job descriptions are sent to Anthropic&apos;s Claude API to generate and score tailored resumes.</li>
          <li>We don&apos;t sell or share your data, and there are no ads or trackers.</li>
          <li>To have your account and data deleted, email coleblender@gmail.com.</li>
        </ul>
      </main>
    </>
  );
}
