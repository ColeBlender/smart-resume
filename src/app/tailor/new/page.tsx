import { Header } from "@/components/header";
import { requireProfile } from "@/lib/profile";
import { TailorForm } from "./tailor-form";

// Two Claude calls (three if the honesty guard triggers a rewrite).
export const maxDuration = 300;

export default async function NewTailoring() {
  const { user, pack, answers } = await requireProfile();

  return (
    <>
      <Header email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl font-semibold">Tailor for a job</h1>
        <p className="mt-2 text-muted">Paste the posting. Skill matching updates live as you type.</p>
        <TailorForm pack={pack} answers={answers} />
      </main>
    </>
  );
}
