import Link from "next/link";

export function Header({ email }: { email?: string }) {
  return (
    <header className="border-b border-line bg-card/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={email ? "/dashboard" : "/"} className="font-serif text-xl font-semibold">
          Smart Resume
        </Link>
        {email && (
          <div className="flex items-center gap-4 text-sm text-muted">
            <Link href="/onboard" className="hover:text-ink">
              Skills
            </Link>
            <span className="hidden sm:inline">{email}</span>
            <form action="/auth/signout" method="post">
              <button className="hover:text-ink">Sign out</button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
