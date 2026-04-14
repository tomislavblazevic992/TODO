"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Task, Profile } from "@/types";
import Navbar from "@/components/Navbar";
import TaskBoard from "@/components/TaskBoard";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAdmin = profile?.role === "admin";
  const canCreate = isAdmin || profile?.permissions?.canCreate === true;

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setTasksLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        creator:profiles!tasks_created_by_fkey(id, full_name, email),
        assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)
      `
      )
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setTasksLoading(false);
  }, [user, supabase]);

  const fetchMembers = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    if (data) setMembers(data as Profile[]);
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchTasks();
      fetchMembers();
    }
  }, [user, loading, router, fetchTasks, fetchMembers]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const hasNoPermissions =
    !isAdmin &&
    !profile.permissions?.canCreate &&
    !profile.permissions?.canComplete;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Ploča zadataka
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {tasks.length} ukupno zadataka
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTasks}
              className="p-2 text-zinc-500 hover:text-white hover:bg-surface rounded-lg transition-colors"
              title="Osvježi"
            >
              <RefreshCw size={15} className={tasksLoading ? "animate-spin" : ""} />
            </button>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-bg font-bold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:block">Novi zadatak</span>
                <span className="sm:hidden">Novo</span>
              </button>
            )}
          </div>
        </div>

        {/* No permissions banner */}
        {hasNoPermissions && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                Čeka se odobrenje admina
              </p>
              <p className="text-xs text-amber-400/70 font-mono mt-1">
                Možeš vidjeti javne zadatke, ali ne možeš kreirati niti
                dovršavati dok admin ne dodijeli dozvole.
              </p>
            </div>
          </div>
        )}

        {/* Board */}
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-surface/50 rounded-2xl border border-border h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <TaskBoard
            initialTasks={tasks}
            currentProfile={profile}
            onRefresh={fetchTasks}
          />
        )}
      </main>

      {/* Create modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchTasks}
          currentProfile={profile}
          members={members}
        />
      )}
    </div>
  );
}
