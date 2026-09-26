import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Privacy · Smart Resume" };

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy</CardTitle>
            <CardDescription>Smart Resume is a demo project. Here is exactly what it does with your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>Google sign-in gives us your name and email address. Nothing else from your Google account.</li>
              <li>
                We store the resume you paste, your skill answers, and the job descriptions and tailored resumes you
                create, in a Supabase database. Row-level security means only your account can read them.
              </li>
              <li>Your resume and job descriptions are sent to Anthropic&apos;s Claude API to generate tailored resumes.</li>
              <li>We don&apos;t sell or share your data, and there are no ads or trackers.</li>
              <li>To have your account and data deleted, email coleblender@gmail.com.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
