import { notFound } from "next/navigation";
import { Gallery } from "./gallery";

export const metadata = { title: "UI preview · Smart Resume" };

// Every screen and state with fake data: no login, no database, no Claude calls.
// Local only unless ENABLE_PREVIEW=1 is set.
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PREVIEW !== "1") notFound();
  return <Gallery />;
}
