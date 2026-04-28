-- 002_seed_demo_data.sql — демо-данные для Финдир MVP v0.7
-- Скрипт можно запускать повторно: старая демо-компания удаляется.

do $$
declare
  v_company_id uuid;
  v_client_id uuid;
  v_service_id uuid;
  v_period_id uuid;
  v_month int;
  v_client text;
  v_service text;
  v_factor numeric;
  v_service_factor numeric;
  v_scenario text;
begin
  delete from public.companies where name = 'Финдир Демо Компания';

  insert into public.companies (name)
  values ('Финдир Демо Компания')
  returning id into v_company_id;

  for v_month in 1..12 loop
    insert into public.periods (company_id, year, month, status)
    values (v_company_id, 2026, v_month, case when v_month <= 4 then 'closed' else 'draft' end);
  end loop;

  foreach v_client in array array['РЭМП','Радомир','Сити-Сервис'] loop
    v_factor := case when v_client = 'РЭМП' then 1.00 when v_client = 'Радомир' then 0.82 else 1.12 end;

    insert into public.clients (company_id, name)
    values (v_company_id, v_client)
    returning id into v_client_id;

    foreach v_service in array array['МОП','ПТ','Опиловка'] loop
      v_service_factor := case when v_service = 'МОП' then 1.00 when v_service = 'ПТ' then 0.46 else 0.27 end;

      insert into public.services (company_id, client_id, name)
      values (v_company_id, v_client_id, v_service)
      returning id into v_service_id;

      for v_month in 1..12 loop
        select id into v_period_id from public.periods where company_id = v_company_id and year = 2026 and month = v_month;
        v_scenario := case when v_month <= 4 then 'fact' else 'plan' end;

        insert into public.financial_records (company_id, period_id, client_id, service_id, scenario, record_type, amount, comment)
        values
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'revenue', round((820000 + (v_month-1)*15000) * v_factor * v_service_factor, 2), 'Демо выручка'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'fot', round((-340000 - (v_month-1)*6000) * v_factor * v_service_factor, 2), 'Демо ФОТ'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'materials', round((-80000 - (v_month-1)*2000) * v_factor * v_service_factor, 2), 'Демо материалы'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'commercial_cost', round((-45000 - (v_month-1)*1000) * v_factor * v_service_factor, 2), 'Демо коммерческие'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'depreciation', round((-15000) * v_factor * v_service_factor, 2), 'Демо амортизация'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'ar_change', round((-50000 + (v_month-1)*2000) * v_factor * v_service_factor, 2), 'Демо дебиторка'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'ap_change', round((20000 - (v_month-1)*500) * v_factor * v_service_factor, 2), 'Демо кредиторка'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'advance_received_change', round((15000) * v_factor * v_service_factor, 2), 'Демо авансы'),
          (v_company_id, v_period_id, v_client_id, v_service_id, v_scenario, 'capex', case when v_month in (1,3,5,8,12) then round((-30000) * v_factor * v_service_factor, 2) else 0 end, 'Демо CAPEX');
      end loop;
    end loop;

    for v_month in 1..12 loop
      select id into v_period_id from public.periods where company_id = v_company_id and year = 2026 and month = v_month;
      v_scenario := case when v_month <= 4 then 'fact' else 'plan' end;

      insert into public.financial_records (company_id, period_id, client_id, service_id, scenario, record_type, amount, comment)
      values
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'office_cost', round((-170000 - (v_month-1)*3000) * v_factor, 2), 'Офисная аллокация'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'interest', round((-20000) * v_factor, 2), 'Проценты'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'tax', round((-50000 - (v_month-1)*1000) * v_factor, 2), 'Налоги'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'loan_received', case when v_month = 2 then round(200000 * v_factor, 2) else 0 end, 'Кредит получен'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'loan_principal_repayment', round((-30000) * v_factor, 2), 'Погашение тела'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'owner_withdrawal', round((-80000 - (v_month-1)*4000) * v_factor, 2), 'Изъятие собственника'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'cash_begin', round((350000 + (v_month-1)*160000) * v_factor, 2), 'Деньги на начало'),
        (v_company_id, v_period_id, v_client_id, null, v_scenario, 'minimum_cash_reserve', round((-350000 - (v_month-1)*5000) * v_factor, 2), 'Неснижаемый остаток');
    end loop;
  end loop;
end $$;
