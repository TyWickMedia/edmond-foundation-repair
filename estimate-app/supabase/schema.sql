-- Run once in the Supabase SQL editor.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  logo_url text,
  address text,
  license text,
  phone text,
  default_terms text,
  created_at timestamptz not null default now()
);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  items jsonb not null default '[]',
  notes text,
  total numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','viewed','accepted','declined')),
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  signer_name text,
  signature text,          -- PNG data URL if drawn, else null
  decline_reason text,
  created_at timestamptz not null default now()
);
create index if not exists estimates_user_idx on estimates (user_id, created_at desc);

alter table profiles enable row level security;
alter table estimates enable row level security;

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own estimates" on estimates for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Customers never touch these tables directly; the public estimate page
-- goes through server routes using the service role + the secret token.

-- Logo storage (public read so the customer page can show it)
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
  on conflict (id) do nothing;
create policy "logo read" on storage.objects for select using (bucket_id = 'logos');
create policy "logo write own" on storage.objects for insert
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logo update own" on storage.objects for update
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logo delete own" on storage.objects for delete
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
