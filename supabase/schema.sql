-- MetaSystem mini-CRM schema for Supabase
-- Run in SQL Editor after creating a project

create table if not exists public.leads (
  id uuid primary key,
  name text default '',
  telegram text default '',
  sex text default 'male',
  age numeric,
  height numeric,
  weight numeric,
  bmi numeric,
  status text default 'new',
  next_contact_at date,
  notes text default '',
  answers jsonb default '{}'::jsonb,
  domain_scores jsonb,
  algorithm jsonb,
  recommendations jsonb,
  pdf_data_url text,
  selected_tariff text,
  nutrition_addon boolean default false,
  purchased_tariff text,
  purchased_at date,
  purchase_price numeric,
  purchase_price_type text default 'stream',
  history jsonb default '[]'::jsonb,
  consult_progress jsonb default '{"blockIndex":0,"slideIndex":0}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_updated_idx on public.leads (updated_at desc);
create index if not exists leads_purchased_at_idx on public.leads (purchased_at desc);

-- If table already exists, run once:
-- alter table public.leads add column if not exists purchased_tariff text;
-- alter table public.leads add column if not exists purchased_at date;
-- alter table public.leads add column if not exists purchase_price numeric;
-- alter table public.leads add column if not exists purchase_price_type text default 'stream';

-- For demo / single-trainer use without auth:
alter table public.leads enable row level security;

create policy "Allow all for anon demo"
  on public.leads
  for all
  using (true)
  with check (true);
