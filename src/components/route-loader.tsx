import { Spinner } from "@/components/ui/spinner";

// Shared body for every route's loading.tsx. The top bar (nextjs-toploader)
// shows the click registered instantly; this fills the page until the server
// render streams in. One spinner everywhere, no skeletons to drift out of sync.
export function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}
