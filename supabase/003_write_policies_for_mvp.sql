-- 003_write_policies_for_mvp.sql
-- Финдир MVP v0.8: временные политики записи для демо/MVP.
-- В продакшене это нужно заменить на авторизацию пользователей и более строгие RLS-политики.

drop policy if exists "allow anon insert companies" on public.companies;
drop policy if exists "allow anon insert clients" on public.clients;
drop policy if exists "allow anon insert services" on public.services;
drop policy if exists "allow anon insert periods" on public.periods;
drop policy if exists "allow anon insert financial_records" on public.financial_records;

create policy "allow anon insert companies" on public.companies for insert with check (true);
create policy "allow anon insert clients" on public.clients for insert with check (true);
create policy "allow anon insert services" on public.services for insert with check (true);
create policy "allow anon insert periods" on public.periods for insert with check (true);
create policy "allow anon insert financial_records" on public.financial_records for insert with check (true);

drop policy if exists "allow anon update clients" on public.clients;
drop policy if exists "allow anon update services" on public.services;
drop policy if exists "allow anon update financial_records" on public.financial_records;

create policy "allow anon update clients" on public.clients for update using (true) with check (true);
create policy "allow anon update services" on public.services for update using (true) with check (true);
create policy "allow anon update financial_records" on public.financial_records for update using (true) with check (true);
