"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Profile, TaskPriority } from "@/types";
import toast from "react-hot-toast";
import { X, Plus, Lock } from "lucide-react";

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
  currentProfile: Profile;
  members: Profile[]; // all profiles (admin use for assigning)
}

export default function CreateTaskModal({
  onClose,
  onCreated,
  currentProfile,
  members,
}: CreateTaskModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const isAdmin = currentProfile.role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      created_by: currentProfile.id,
      assigned_to: assignedTo || null,
      status: "todo",
      sort_order: Date.now(),
    });

    if (error) {
      toast.error("Greška pri kreiranju zadatka: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Zadatak kreiran!");
    onCreated();
    onClose();
  };

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: "low", label: "Nisko", color: "text-zinc-400" },
    { value: "medium", label: "Srednje", color: "text-blue-400" },
    { value: "high", label: "Visoko", color: "text-red-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-5 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base tracking-tight">Novi zadatak</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-border"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Naziv *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="Što treba napraviti?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Opis
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 resize-none"
              placeholder="Detalji zadatka (opcionalno)..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
              Prioritet
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`py-2 rounded-lg text-xs font-mono border transition-colors
                    ${
                      priority === opt.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-border bg-bg text-zinc-500 hover:border-zinc-600"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign to (admin only) */}
          {isAdmin && members.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Lock size={11} />
                  Dodijeli članu (privatni)
                </span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors text-zinc-300"
              >
                <option value="">— Javni zadatak —</option>
                {members
                  .filter((m) => m.id !== currentProfile.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
              </select>
              {assignedTo && (
                <p className="text-xs text-amber-400/70 font-mono mt-1.5 flex items-center gap-1">
                  <Lock size={10} />
                  Samo ti i dodijeljeni korisnik vide ovaj zadatak
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-bg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  Kreiraj
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
