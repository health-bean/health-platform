"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Calendar, Heart, LineChart, Settings, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

const tabs = [
  { label: "Chat", href: "/chat", icon: MessageSquare, adminOnly: false },
  { label: "Timeline", href: "/timeline", icon: Calendar, adminOnly: false },
  { label: "Reflect", href: "/reflect", icon: Heart, adminOnly: false },
  { label: "Insights", href: "/insights", icon: LineChart, adminOnly: false },
  { label: "Settings", href: "/settings", icon: Settings, adminOnly: false },
  { label: "Admin", href: "/admin", icon: Wrench, adminOnly: true },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useSession();

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || user?.isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="flex items-stretch justify-around">
        {visibleTabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2",
                "transition-colors duration-150",
                "active:bg-slate-100",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
