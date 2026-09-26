"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function SignOutItem() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenuItem onSelect={signOut}>
      <LogOut /> Sign out
    </DropdownMenuItem>
  );
}
