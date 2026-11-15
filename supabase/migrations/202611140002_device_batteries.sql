begin;

create table public.device_batteries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  token_hash text unique check (token_hash ~ '^[0-9a-f]{64}$'),
  level integer check (level between 0 and 100),
  reported_at timestamptz,
  check ((level is null) = (reported_at is null))
);
create index device_batteries_user_idx on public.device_batteries (user_id);
alter table public.device_batteries enable row level security;
revoke all on public.device_batteries from public, anon, authenticated;
grant select, insert, update, delete on public.device_batteries to authenticated;
create policy "own devices" on public.device_batteries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- A paired shortcut can report one device's level using its random token.
create function public.report_device_battery(p_token text, p_level integer)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' or
     p_level is null or p_level not between 0 and 100 then
    return false;
  end if;
  update public.device_batteries
    set level = p_level, reported_at = statement_timestamp()
    where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  return found;
end;
$$;
revoke all on function public.report_device_battery(text, integer) from public, anon, authenticated;
grant execute on function public.report_device_battery(text, integer) to anon;

commit;
