"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import {
  GripVertical,
  Trash2,
  User,
  Clock,
  Flag,
  Lock,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  canDelete: boolean;
  isAdmin: boolean;
  currentUserId: string;
  onDelete: (id: string) => void;
}

const priorityConfig = {
  low: { label: "Nisko", color: "text-zinc-500", dot: "bg-zinc-600" },
  medium: { label: "Srednje", color: "text-blue-400", dot: "bg-blue-500" },
  high: { label: "Visoko", color: "text-red-400", dot: "bg-red-500" },
};

export default function TaskCard({
  task,
  canDelete,
  isAdmin,
  currentUserId,
  onDelete,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const priority = priorityConfig[task.priority];
  const isAssigned = task.assigned_to !== null;
  const isAssignedToMe = task.assigned_to === currentUserId;
  const canDeleteThis =
    isAdmin || (canDelete && task.created_by === currentUserId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-surface border rounded-xl p-3.5 select-none transition-all
        ${isDragging ? "shadow-2xl shadow-black/50 scale-[1.02]" : "shadow-sm hover:shadow-md hover:border-zinc-600"}
        ${isAssigned && !isAssignedToMe && isAdmin ? "border-amber-500/30" : "border-border"}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-zinc-700 hover:text-zinc-400 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Pomjeri zadatak"
        >
          <GripVertical size={15} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug text-zinc-100 break-words">
              {task.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Private badge */}
              {isAssigned && (
                <div
                  className="text-amber-400"
                  title={
                    isAdmin
                      ? `Dodijeljeno: ${task.assignee?.full_name || task.assignee?.email}`
                      : "Privatni zadatak"
                  }
                >
                  <Lock size={12} />
                </div>
              )}
              {/* Delete button */}
              {canDeleteThis && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5 rounded"
                  title="Obriši zadatak"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Assignee (admin view) */}
          {isAdmin && isAssigned && task.assignee && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400/70 font-mono">
              <User size={11} />
              <span className="truncate">
                {task.assignee.full_name || task.assignee.email}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            {/* Creator */}
            <div className="flex items-center gap-1 text-xs text-zinc-600 font-mono min-w-0">
              <User size={10} />
              <span className="truncate">
                {task.creator?.full_name || task.creator?.email || "—"}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Priority */}
              <div className={`flex items-center gap-1 text-xs font-mono ${priority.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                <Flag size={10} />
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-zinc-700 font-mono">
                <Clock size={10} />
                <span>
                  {format(new Date(task.created_at), "dd.MM HH:mm", {
                    locale: hr,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
