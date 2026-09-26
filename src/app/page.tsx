import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { LandingView } from "@/components/landing-view";
import { createClient } from "@/lib/supabase/server";

export default async function Home({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <>
      <Header />
      <LandingView error={!!error} />
    </>
  );
}
