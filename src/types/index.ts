export type Role = "admin" | "member";

export interface Permissions {
  canCreate: boolean;
  canComplete: boolean;
  canDelete: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  permissions: Permissions;
  created_at: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string | null;
  assigned_to: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Pick<Profile, "id" | "full_name" | "email">;
  assignee?: Pick<Profile, "id" | "full_name" | "email">;
}

export interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
