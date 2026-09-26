import { Header } from "@/components/header";
import { requireUser } from "@/lib/supabase/server";

// Signed-in pages share one header, so page switches only swap the content
// below it (each route's loading.tsx spinner renders under the header).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireUser();
  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}
