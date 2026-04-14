"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(
      "Račun kreiran! Admin treba odobriti tvoje dozvole prije korištenja."
    );
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-xl mb-4">
            <span className="text-bg font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            Kreiraj novi račun
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400 font-mono leading-relaxed">
            ⚠️ Nakon registracije, admin mora dodijeliti dozvole da bi mogao
            kreirati i dovršavati zadatke.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Puno ime
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="Ime Prezime"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="ti@primjer.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Lozinka
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 pr-12"
                placeholder="Minimalno 6 znakova"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-bg font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Registriraj se
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6 font-mono">
          Već imaš račun?{" "}
          <Link
            href="/login"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  );
}
