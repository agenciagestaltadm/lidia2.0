"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        router.push("/login");
        return;
      }

      // Super users should use /super routes
      if (profile.role === "SUPER_USER") {
        router.push("/super/central");
        return;
      }

      // Check if user has company
      if (!profile.company_id) {
        router.push("/login?error=no_company");
        return;
      }

      setProfile(profile);
      setLoading(false);
    };

    fetchProfile();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        role={profile.role}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? "lg:ml-0" : ""}`}>
        <Header
          profile={profile}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
