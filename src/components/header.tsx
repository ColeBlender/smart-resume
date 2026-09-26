"use client";

import { FileText, Files, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutItem } from "./sign-out-item";
import { ThemeToggle } from "./theme-toggle";

type HeaderUser = { email?: string; user_metadata?: { avatar_url?: string; full_name?: string } };

const MENU = [
  { href: "/dashboard", label: "Tailor a resume", icon: Home },
  { href: "/resumes", label: "My resumes", icon: Files },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Where you are, as breadcrumb crumbs. The last crumb is the current page. */
function crumbsFor(path: string): { label: string; href?: string }[] {
  if (path.startsWith("/resumes")) return [{ label: "My resumes" }];
  if (path.startsWith("/tailor/")) return [{ label: "My resumes", href: "/resumes" }, { label: "Resume" }];
  if (path.startsWith("/profile")) return [{ label: "Profile" }];
  if (path.startsWith("/onboard")) return [{ label: "Setup" }];
  if (path.startsWith("/dashboard")) return [{ label: "Tailor a resume" }];
  return [];
}

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
  const crumbs = user ? crumbsFor(current) : [];

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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={user ? "/dashboard" : "/"}>
                  <Logo />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((c) => (
              <Fragment key={c.label}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {c.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={c.href}>{c.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
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
                {MENU.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild className={current.startsWith(href) ? "bg-accent" : undefined}>
                    <Link href={href}>
                      <Icon /> {label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <SignOutItem />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
