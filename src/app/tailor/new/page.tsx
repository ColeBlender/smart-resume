import { Header } from "@/components/header";
import { requireProfile } from "@/lib/profile";
import { TailorForm } from "./tailor-form";

// Two Claude calls (three if the honesty guard triggers a rewrite).
export const maxDuration = 300;

export default async function NewTailoring() {
  const { user, pack, answers } = await requireProfile();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Tailor for a job</h1>
        <p className="mt-2 text-muted-foreground">Paste the posting. Skill matching updates live as you type.</p>
        <TailorForm pack={pack} answers={answers} />
      </main>
    </>
  );
}
