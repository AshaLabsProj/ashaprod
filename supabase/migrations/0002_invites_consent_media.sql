-- Phase A + C: parental consent, secure invite claiming, and media storage.

-- ---------------------------------------------------------------------------
-- Consent: record when a guardian accepted, per player link.
-- ---------------------------------------------------------------------------
alter table player_guardians
  add column if not exists consent_given_at timestamptz;

-- ---------------------------------------------------------------------------
-- Secure invite claiming.
-- A parent isn't allowed to write player_guardians directly (RLS requires the
-- coach), so claiming goes through this SECURITY DEFINER function. It validates
-- the code, requires consent, links the guardian, and marks the invite used.
-- ---------------------------------------------------------------------------
create or replace function claim_invite(invite_code text, consent boolean default false)
returns players
language plpgsql
security definer set search_path = public
as $$
declare
  inv invites%rowtype;
  ply players%rowtype;
begin
  select * into inv from invites where code = invite_code;
  if not found then
    raise exception 'Invalid invite code';
  end if;
  if inv.claimed_at is not null then
    raise exception 'This invite has already been used';
  end if;
  if inv.expires_at < now() then
    raise exception 'This invite has expired';
  end if;
  if not consent then
    raise exception 'Parental consent is required to continue';
  end if;

  insert into player_guardians (player_id, guardian_id, consent_given_at)
  values (inv.player_id, auth.uid(), now())
  on conflict (player_id, guardian_id)
    do update set consent_given_at = excluded.consent_given_at;

  update invites
     set claimed_by = auth.uid(), claimed_at = now()
   where id = inv.id;

  select * into ply from players where id = inv.player_id;
  return ply;
end;
$$;

grant execute on function claim_invite(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Media storage (Phase C). Private bucket; objects keyed as
--   {coach_id}/{player_id}/{uuid}.{ext}
-- so RLS can authorize by folder.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('session-media', 'session-media', false)
on conflict (id) do nothing;

-- Coach writes only into their own top-level folder.
create policy "coach uploads session media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "coach deletes own session media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'session-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: the owning coach, or a guardian linked to the player (2nd folder).
create policy "read session media" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from player_guardians pg
        where pg.guardian_id = auth.uid()
          and pg.player_id::text = (storage.foldername(name))[2]
      )
    )
  );
