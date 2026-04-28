-- 001_schema.sql — Финдир MVP v0.7
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists public.periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  status text not null default 'draft',
  created_at timestamptz default now(),
  unique(company_id, year, month)
);

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  period_id uuid references public.periods(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  scenario text not null check (scenario in ('fact', 'plan', 'forecast')),
  record_type text not null check (record_type in (
    'revenue','fot','materials','commercial_cost','office_cost','depreciation','interest','tax',
    'ar_change','ap_change','advance_received_change','capex','loan_received','loan_principal_repayment',
    'owner_withdrawal','cash_begin','minimum_cash_reserve'
  )),
  amount numeric(14,2) not null,
  comment text,
  created_at timestamptz default now()
);

alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.periods enable row level security;
alter table public.financial_records enable row level security;

drop policy if exists "allow anon read companies" on public.companies;
drop policy if exists "allow anon read clients" on public.clients;
drop policy if exists "allow anon read services" on public.services;
drop policy if exists "allow anon read periods" on public.periods;
drop policy if exists "allow anon read financial_records" on public.financial_records;

create policy "allow anon read companies" on public.companies for select using (true);
create policy "allow anon read clients" on public.clients for select using (true);
create policy "allow anon read services" on public.services for select using (true);
create policy "allow anon read periods" on public.periods for select using (true);
create policy "allow anon read financial_records" on public.financial_records for select using (true);
