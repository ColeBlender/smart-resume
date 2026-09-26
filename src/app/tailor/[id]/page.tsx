import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ResultView, type Tailoring } from "@/components/result-view";
import { requireProfile } from "@/lib/profile";

export default async function TailoringPage({ params }: PageProps<"/tailor/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireProfile();

  // RLS limits this to the user's own rows; someone else's id is simply not found.
  const { data } = await supabase.from("tailorings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <>
      <Header user={user} />
      <ResultView t={data as Tailoring} />
    </>
  );
}
