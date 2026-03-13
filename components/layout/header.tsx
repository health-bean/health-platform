"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Chat", href: "/chat" },
  { label: "Timeline", href: "/timeline" },
  { label: "Reflect", href: "/reflect" },
  { label: "Insights", href: "/insights" },
  { label: "Settings", href: "/settings" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSession();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <span className="text-lg font-bold tracking-tight text-indigo-600">
          FILO
        </span>

        {/* Desktop nav — hidden on mobile (mobile nav handles it) */}
        {!loading && user && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {user.isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        )}

        {/* User area */}
        <div className="flex items-center gap-3">
          {!loading && user && (
            <>
              <span className="text-sm text-slate-600">{user.firstName}</span>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                  "transition-colors duration-150"
                )}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
