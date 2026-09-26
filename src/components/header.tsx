"use client";

import { FileText, Files, Menu, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SignOutItem } from "./sign-out-item";
import { ThemeToggle } from "./theme-toggle";

type HeaderUser = { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } };

const NAV = [
  { href: "/dashboard", label: "Tailor", icon: Sparkles, match: ["/dashboard"] },
  { href: "/resumes", label: "My resumes", icon: Files, match: ["/resumes", "/tailor"] },
  { href: "/profile", label: "Profile", icon: UserRound, match: ["/profile", "/onboard"] },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <FileText className="size-4" />
      </span>
      Smart Resume
    </span>
  );
}

/** `path` overrides the real URL (the /preview gallery renders pages outside their routes). */
export function Header({ user, path }: { user?: HeaderUser; path?: string }) {
  const pathname = usePathname();
  const current = path ?? pathname;
  const isActive = (match: string[]) => match.some((m) => current.startsWith(m));

  const name = user?.user_metadata?.full_name ?? user?.email ?? "";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"}>
            <Logo />
          </Link>
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map(({ href, label, icon: Icon, match }) => (
                <Button key={href} variant={isActive(match) ? "secondary" : "ghost"} size="sm" asChild>
                  <Link href={href} aria-current={isActive(match) ? "page" : undefined}>
                    <Icon /> {label}
                  </Link>
                </Button>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                    <Avatar className="size-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                      <AvatarFallback>{initials || "?"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <SignOutItem />
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle>
                      <Logo />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 px-4">
                    {NAV.map(({ href, label, icon: Icon, match }) => (
                      <SheetClose key={href} asChild>
                        <Button variant={isActive(match) ? "secondary" : "ghost"} className="justify-start" asChild>
                          <Link href={href} aria-current={isActive(match) ? "page" : undefined}>
                            <Icon /> {label}
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
