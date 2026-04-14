-- ============================================
-- TaskFlow - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  permissions jsonb not null default '{"canCreate": false, "canComplete": false, "canDelete": false}'::jsonb,
  created_at timestamptz not null default now()
);

-- Automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TASKS TABLE
-- ============================================
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_task_updated
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- PROFILES policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- TASKS policies
-- Select: admin sees all, members see public tasks + their assigned tasks
create policy "Task select policy"
  on public.tasks for select
  using (
    -- Admin sees everything
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or
    -- Task is not assigned to anyone (public)
    assigned_to is null
    or
    -- Task is assigned to current user
    assigned_to = auth.uid()
    or
    -- Current user created it
    created_by = auth.uid()
  );

-- Insert: user must have canCreate permission or be admin
create policy "Task insert policy"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          role = 'admin'
          or (permissions->>'canCreate')::boolean = true
        )
    )
  );

-- Update: admin always, members with canComplete can update status only
create policy "Task update policy"
  on public.tasks for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          role = 'admin'
          or (permissions->>'canComplete')::boolean = true
          or (permissions->>'canCreate')::boolean = true
        )
    )
  );

-- Delete: admin or creator with canDelete permission
create policy "Task delete policy"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or (
      created_by = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid()
          and (permissions->>'canDelete')::boolean = true
      )
    )
  );

-- ============================================
-- MAKE FIRST USER ADMIN (run after first signup)
-- Or manually set a specific user as admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================
