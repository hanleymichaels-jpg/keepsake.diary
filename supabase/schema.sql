-- Keepsake · run once in the Supabase SQL editor.

create table if not exists public.entries (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  at            bigint not null,
  updated_at    bigint not null,
  deleted_at    bigint,
  text          text not null default '',
  transcript    text,
  source        text not null,
  audio         jsonb,
  transcribing  boolean not null default false,
  media         jsonb not null default '[]'::jsonb,
  people        text[] not null default '{}',
  places        text[] not null default '{}',
  keywords      text[] not null default '{}',
  title         text
);
create index if not exists entries_user_updated on public.entries (user_id, updated_at);

alter table public.entries enable row level security;
drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  names       text not null default '',
  nudge_on    boolean not null default true,
  nudge_time  text not null default '19:30',
  updated_at  bigint not null default 0
);
alter table public.settings enable row level security;
drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket; each user may only touch objects under their own folder.
insert into storage.buckets (id, name, public, file_size_limit)
  values ('media', 'media', false, 1073741824)
  on conflict (id) do nothing;

drop policy if exists "own media read" on storage.objects;
drop policy if exists "own media write" on storage.objects;
drop policy if exists "own media update" on storage.objects;
drop policy if exists "own media delete" on storage.objects;
create policy "own media read" on storage.objects for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own media write" on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own media update" on storage.objects for update
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own media delete" on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
