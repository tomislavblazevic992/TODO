"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Profile } from "@/types";
import toast from "react-hot-toast";
import { LogOut, Settings, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  profile: Profile;
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Odjavljeni ste");
    router.push("/login");
    router.refresh();
  };

  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    profile.email.slice(0, 2).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-bg font-bold text-xs">T</span>
            </div>
            <span className="font-bold tracking-tight hidden sm:block">
              TaskFlow
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 hover:text-white hover:bg-surface transition-colors"
            >
              <LayoutDashboard size={13} />
              Board
            </Link>
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 hover:text-white hover:bg-surface transition-colors"
              >
                <Settings size={13} />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          {profile.role === "admin" && (
            <span className="hidden sm:block text-xs font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              admin
            </span>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-zinc-300">
              {initials}
            </div>
            <span className="text-xs text-zinc-400 font-mono hidden sm:block max-w-[120px] truncate">
              {profile.full_name || profile.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-surface rounded-md transition-colors"
            title="Odjava"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
