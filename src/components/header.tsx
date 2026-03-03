"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User, LogOut, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

interface HeaderProps {
  profile: Profile;
  onMenuClick: () => void;
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isSuperUser = profile.role === "SUPER_USER";

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hidden lg:flex"
            title="Colapsar sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Online status */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            <span>Online</span>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Profile dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative"
            >
              <User className="h-5 w-5" />
            </Button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-popover p-2 shadow-md z-50">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-primary mt-1">
                      {isSuperUser ? "Superusuário" : "Usuário"}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <Link
                    href={isSuperUser ? "/super/settings" : "/app/settings"}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Minha conta
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
