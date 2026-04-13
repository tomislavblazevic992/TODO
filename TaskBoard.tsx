"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Task, TaskStatus, Profile } from "@/types";
import { createClient } from "@/lib/supabase";
import TaskCard from "./TaskCard";
import toast from "react-hot-toast";

interface TaskBoardProps {
  initialTasks: Task[];
  currentProfile: Profile;
  onRefresh: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; accent: string }[] = [
  { id: "todo", title: "Za napraviti", accent: "border-zinc-700" },
  { id: "in_progress", title: "U tijeku", accent: "border-blue-500/40" },
  { id: "done", title: "Završeno", accent: "border-emerald-500/40" },
];

export default function TaskBoard({
  initialTasks,
  currentProfile,
  onRefresh,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const supabase = createClient();

  const isAdmin = currentProfile.role === "admin";
  const canComplete =
    isAdmin || currentProfile.permissions.canComplete;
  const canDelete =
    isAdmin || currentProfile.permissions.canDelete;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.sort_order - b.sort_order);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the overId belongs to
    const overTask = tasks.find((t) => t.id === overId);
    const overColumn = COLUMNS.find((c) => c.id === overId);

    const newStatus: TaskStatus | null = overTask
      ? overTask.status
      : overColumn
      ? overColumn.id
      : null;

    if (!newStatus) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.status === newStatus) return;

    // Permission check: only admin or users with canComplete can change status
    if (!canComplete) {
      toast.error("Nemate dozvolu za promjenu statusa zadataka");
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status: newStatus } : t
      )
    );
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTask = tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      const overTask = tasks.find((t) => t.id === overId);
      const overColumn = COLUMNS.find((c) => c.id === overId);
      const targetStatus: TaskStatus =
        overTask?.status ?? overColumn?.id ?? activeTask.status;

      // Reorder within column
      const columnTasks = tasks
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.sort_order - b.sort_order);

      const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
      const overIndex = overTask
        ? columnTasks.findIndex((t) => t.id === overId)
        : columnTasks.length;

      let reordered = [...columnTasks];
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        reordered = arrayMove(reordered, activeIndex, overIndex);
      }

      // Assign new sort orders
      const updates = reordered.map((t, i) => ({
        id: t.id,
        sort_order: i * 1000,
        status: targetStatus,
      }));

      // Optimistic update
      setTasks((prev) => {
        const unchanged = prev.filter((t) => t.status !== targetStatus || !updates.find((u) => u.id === t.id));
        const updated = updates.map((u) => {
          const task = prev.find((t) => t.id === u.id)!;
          return { ...task, ...u };
        });
        return [...unchanged, ...updated];
      });

      // Persist to Supabase
      for (const update of updates) {
        await supabase
          .from("tasks")
          .update({ status: update.status, sort_order: update.sort_order })
          .eq("id", update.id);
      }
    },
    [tasks, supabase]
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Greška pri brisanju");
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Zadatak obrisan");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {COLUMNS.map((col) => {
          const colTasks = getTasksByStatus(col.id);

          return (
            <div
              key={col.id}
              id={col.id}
              className={`flex flex-col bg-surface/50 rounded-2xl border ${col.accent} min-h-[200px] overflow-hidden`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <h3 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest">
                  {col.title}
                </h3>
                <span className="text-xs font-mono bg-border/50 text-zinc-500 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[100px]"
                  id={col.id}
                >
                  {colTasks.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-xs text-zinc-700 font-mono border border-dashed border-zinc-800 rounded-xl">
                      Nema zadataka
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canDelete={canDelete}
                      isAdmin={isAdmin}
                      currentUserId={currentProfile.id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag overlay (floating card while dragging) */}
      {typeof window !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeTask && (
              <div className="rotate-1 scale-105 shadow-2xl">
                <TaskCard
                  task={activeTask}
                  canDelete={false}
                  isAdmin={isAdmin}
                  currentUserId={currentProfile.id}
                  onDelete={() => {}}
                />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
