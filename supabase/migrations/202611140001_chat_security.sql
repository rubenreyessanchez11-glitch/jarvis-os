begin;

-- Existing rows are retained. New writes must match the conversation owner.
alter table public.conversations
  add constraint conversations_id_user_id_key unique (id, user_id);
alter table public.messages
  add constraint messages_conversation_owner_fkey
  foreign key (conversation_id, user_id)
  references public.conversations (id, user_id) on delete cascade not valid;
create index messages_conversation_owner_idx on public.messages (conversation_id, user_id);

drop policy "own rows" on public.messages;
create policy "own messages in own conversations" on public.messages
  for all to authenticated
  using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.conversations where conversations.id = messages.conversation_id
        and conversations.user_id = messages.user_id
    )
  )
  with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.conversations where conversations.id = messages.conversation_id
        and conversations.user_id = messages.user_id
    )
  );

create table public.chat_daily_usage (
  user_id uuid primary key references auth.users on delete cascade,
  usage_day date not null,
  calls integer not null check (calls between 1 and 60)
);
alter table public.chat_daily_usage enable row level security;
revoke all on public.chat_daily_usage from public, anon, authenticated;

-- Atomic reservation before calling a paid provider. Compare reserves three calls.
create function public.reserve_chat_calls(calls integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  today date := (now() at time zone 'UTC')::date;
begin
  if caller is null or calls is null or calls not between 1 and 3 then
    return false;
  end if;

  insert into public.chat_daily_usage as usage (user_id, usage_day, calls)
  values (caller, today, calls)
  on conflict (user_id) do update
    set usage_day = excluded.usage_day,
        calls = case when usage.usage_day = excluded.usage_day
                     then usage.calls + excluded.calls else excluded.calls end
    where usage.usage_day < excluded.usage_day
       or (usage.usage_day = excluded.usage_day and usage.calls + excluded.calls <= 60);
  return found;
end;
$$;
revoke all on function public.reserve_chat_calls(integer) from public, anon, authenticated;
grant execute on function public.reserve_chat_calls(integer) to authenticated;

commit;
