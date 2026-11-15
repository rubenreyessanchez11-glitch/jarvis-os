-- Run in Supabase: SQL Editor > New query > paste > Run.
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, done boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null, time text not null default '', title text not null,
  source text not null default 'personal',
  created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text, created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  conversation_id uuid not null references public.conversations on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null, provider text, model text, compare_group uuid,
  created_at timestamptz not null default now()
);
-- Row-level security: every user sees only their own rows.
do $$ declare t text; begin
  foreach t in array array['missions','events','conversations','messages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
