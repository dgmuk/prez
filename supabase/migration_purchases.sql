-- Run in Supabase SQL Editor if leads table already exists
alter table public.leads add column if not exists purchased_tariff text;
alter table public.leads add column if not exists purchased_at date;
alter table public.leads add column if not exists purchase_price numeric;
alter table public.leads add column if not exists purchase_price_type text default 'stream';
create index if not exists leads_purchased_at_idx on public.leads (purchased_at desc);
