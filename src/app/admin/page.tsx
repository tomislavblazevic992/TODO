"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Profile, Permissions } from "@/types";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import {
  Shield,
  Users,
  Check,
  X,
  PenLine,
  Trash2,
  CheckSquare,
  Crown,
  UserCheck,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const supabase = createClient();

  const [members, setMembers] = useState<Profile[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setMembers(data as Profile[]);
    setMembersLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (profile?.role !== "admin") { router.push("/dashboard"); return; }
      fetchMembers();
    }
  }, [user, profile, loading, router, fetchMembers]);

  const updatePermission = async (
    memberId: string,
    currentPermissions: Permissions,
    key: keyof Permissions,
    value: boolean
  ) => {
    setSaving(memberId + key);
    const newPermissions = { ...currentPermissions, [key]: value };

    const { error } = await supabase
      .from("profiles")
      .update({ permissions: newPermissions })
      .eq("id", memberId);

    if (error) {
      toast.error("Greška pri ažuriranju dozvola");
    } else {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, permissions: newPermissions } : m
        )
      );
      toast.success("Dozvola ažurirana");
    }
    setSaving(null);
  };

  const promoteToAdmin = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const confirmMsg =
      newRole === "admin"
        ? "Promovirati korisnika u admina?"
        : "Degradirati korisnika na člana?";
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast.error("Greška pri promjeni uloge");
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as "admin" | "member" } : m))
      );
      toast.success(
        newRole === "admin" ? "Korisnik promoviran u admina" : "Korisnik degradiran na člana"
      );
    }
  };

  const grantAllPermissions = async (memberId: string) => {
    setSaving(memberId + "all");
    const allPerms: Permissions = {
      canCreate: true,
      canComplete: true,
      canDelete: true,
    };
    const { error } = await supabase
      .from("profiles")
      .update({ permissions: allPerms })
      .eq("id", memberId);

    if (!error) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, permissions: allPerms } : m
        )
      );
      toast.success("Sve dozvole dodijeljene");
    }
    setSaving(null);
  };

  const revokeAllPermissions = async (memberId: string) => {
    setSaving(memberId + "none");
    const noPerms: Permissions = {
      canCreate: false,
      canComplete: false,
      canDelete: false,
    };
    const { error } = await supabase
      .from("profiles")
      .update({ permissions: noPerms })
      .eq("id", memberId);

    if (!error) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, permissions: noPerms } : m
        )
      );
      toast.success("Sve dozvole ukinute");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const regularMembers = members.filter(
    (m) => m.id !== profile.id && m.role !== "admin"
  );
  const admins = members.filter((m) => m.role === "admin");

  const PermToggle = ({
    memberId,
    permissions,
    permKey,
    label,
    icon: Icon,
  }: {
    memberId: string;
    permissions: Permissions;
    permKey: keyof Permissions;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
icon: any;
  }) => {
    const isOn = permissions[permKey];
    const isLoading = saving === memberId + permKey;

    return (
      <button
        onClick={() => updatePermission(memberId, permissions, permKey, !isOn)}
        disabled={!!saving}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border transition-all
          ${
            isOn
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-surface border-border text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
        ) : isOn ? (
          <Check size={12} />
        ) : (
          <X size={12} />
        )}
        <Icon size={12} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin panel</h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Upravljanje korisnicima i dozvolama
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Ukupno članova", value: members.length, icon: Users },
            { label: "Admini", value: admins.length, icon: Crown },
            {
              label: "S dozvolama",
              value: regularMembers.filter((m) => m.permissions.canCreate).length,
              icon: UserCheck,
            },
            {
              label: "Na čekanju",
              value: regularMembers.filter((m) => !m.permissions.canCreate && !m.permissions.canComplete).length,
              icon: Shield,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-500">
                  {stat.label}
                </span>
                <stat.icon size={13} className="text-zinc-600" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Admins section */}
        {admins.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Crown size={12} className="text-amber-400" />
              Admini
            </h2>
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-surface border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                      {(admin.full_name || admin.email)
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {admin.full_name || "—"}{" "}
                        {admin.id === profile.id && (
                          <span className="text-xs text-zinc-500 font-mono">(ti)</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono truncate">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      admin
                    </span>
                    {admin.id !== profile.id && (
                      <button
                        onClick={() => promoteToAdmin(admin.id, admin.role)}
                        className="text-xs font-mono text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded border border-border hover:border-zinc-600 transition-colors"
                        title="Degradiraj na člana"
                      >
                        Degradiraj
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Members section */}
        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users size={12} />
            Članovi ({regularMembers.length})
          </h2>

          {membersLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : regularMembers.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <Users size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 font-mono">
                Nema registriranih članova
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {regularMembers.map((member) => {
                const initials = (member.full_name || member.email)
                  .slice(0, 2)
                  .toUpperCase();
                const hasAnyPerm =
                  member.permissions.canCreate ||
                  member.permissions.canComplete ||
                  member.permissions.canDelete;

                return (
                  <div
                    key={member.id}
                    className={`bg-surface rounded-xl border transition-colors ${
                      hasAnyPerm ? "border-border" : "border-zinc-800"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* User info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                              hasAnyPerm
                                ? "bg-zinc-700 border-zinc-600 text-white"
                                : "bg-zinc-800/50 border-zinc-800 text-zinc-600"
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {member.full_name || "Bez imena"}
                              </p>
                              {!hasAnyPerm && (
                                <span className="text-xs font-mono text-amber-400/70 bg-amber-500/10 border border-amber-500/15 px-1.5 py-0.5 rounded-full">
                                  na čekanju
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 font-mono truncate">
                              {member.email}
                            </p>
                            <p className="text-xs text-zinc-700 font-mono mt-0.5">
                              Registriran:{" "}
                              {new Date(member.created_at).toLocaleDateString(
                                "hr-HR"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => grantAllPermissions(member.id)}
                            disabled={!!saving}
                            className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Dodijeli sve dozvole"
                          >
                            <CheckSquare size={12} />
                            <span className="hidden sm:block">Sve</span>
                          </button>
                          <button
                            onClick={() => revokeAllPermissions(member.id)}
                            disabled={!!saving}
                            className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Ukini sve dozvole"
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:block">Ništa</span>
                          </button>
                          <button
                            onClick={() => promoteToAdmin(member.id, member.role)}
                            disabled={!!saving}
                            className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Promoviraj u admina"
                          >
                            <Crown size={12} />
                            <span className="hidden sm:block">Admin</span>
                          </button>
                        </div>
                      </div>

                      {/* Permission toggles */}
                      <div className="mt-3 flex flex-wrap gap-2 pl-12">
                        <PermToggle
                          memberId={member.id}
                          permissions={member.permissions}
                          permKey="canCreate"
                          label="Kreiranje"
                          icon={PenLine}
                        />
                        <PermToggle
                          memberId={member.id}
                          permissions={member.permissions}
                          permKey="canComplete"
                          label="Dovršavanje"
                          icon={CheckSquare}
                        />
                        <PermToggle
                          memberId={member.id}
                          permissions={member.permissions}
                          permKey="canDelete"
                          label="Brisanje"
                          icon={Trash2}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
