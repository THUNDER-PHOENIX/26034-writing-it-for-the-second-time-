-- Run this in the Supabase SQL editor (Project → SQL → New query) to set up
-- the persistence layer for the Legal Metrology Compliance Checker.

create extension if not exists "pgcrypto";

create table if not exists public.scans (
  id text primary key,
  created_at timestamptz not null default now(),
  product_name text not null,
  inspector text,
  location text,
  category text,
  manufacturer text,
  mrp text,
  net_quantity text,
  mfg_date text,
  ocr_text text,
  ocr_provider text,
  image_path text,
  score integer not null,
  compliant boolean not null,
  critical_count integer not null default 0,
  major_count integer not null default 0,
  minor_count integer not null default 0,
  violations jsonb not null default '[]'::jsonb,
  font_findings jsonb,
  barcode_value text
);

create index if not exists scans_created_at_idx on public.scans (created_at desc);

-- For the hackathon demo we keep things open: no auth, anyone can read/write.
-- In production add Row-Level Security policies bound to authenticated users.
alter table public.scans enable row level security;

drop policy if exists "scans_anon_all" on public.scans;
create policy "scans_anon_all" on public.scans
  for all
  to anon
  using (true)
  with check (true);

-- Storage bucket for captured label images.
insert into storage.buckets (id, name, public)
values ('scans', 'scans', true)
on conflict (id) do nothing;

drop policy if exists "scans_bucket_anon_all" on storage.objects;
create policy "scans_bucket_anon_all" on storage.objects
  for all
  to anon
  using (bucket_id = 'scans')
  with check (bucket_id = 'scans');
