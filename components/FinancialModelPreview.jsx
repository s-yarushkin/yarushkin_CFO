"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getDemoModel } from "@/lib/demoData";

const modes = ["Факт", "Факт + прогноз", "Дельта"];

const recordTypes = [
  { value: "revenue", label: "Выручка", sign: "plus", level: "service" },
  { value: "fot", label: "ФОТ", sign: "minus", level: "service" },
  { value: "materials", label: "Материалы", sign: "minus", level: "service" },
  { value: "commercial_cost", label: "Коммерческие затраты", sign: "minus", level: "service" },
  { value: "office_cost", label: "Офисные затраты", sign: "minus", level: "client" },
  { value: "depreciation", label: "Амортизация", sign: "minus", level: "service" },
  { value: "interest", label: "Проценты по кредитам", sign: "minus", level: "client" },
  { value: "tax", label: "Налоги", sign: "minus", level: "client" },
  { value: "ar_change", label: "Рост дебиторки", sign: "minus", level: "service" },
  { value: "ap_change", label: "Рост кредиторки", sign: "plus", level: "service" },
  { value: "advance_received_change", label: "Рост авансов", sign: "plus", level: "service" },
  { value: "capex", label: "CAPEX", sign: "minus", level: "service" },
  { value: "loan_received", label: "Кредиты полученные", sign: "plus", level: "client" },
  { value: "loan_principal_repayment", label: "Погашение тела кредита", sign: "minus", level: "client" },
  { value: "owner_withdrawal", label: "Изъятия / дивиденды", sign: "minus", level: "client" },
  { value: "cash_begin", label: "Cash Begin", sign: "plus", level: "client" },
  { value: "minimum_cash_reserve", label: "Неснижаемый остаток", sign: "minus", level: "client" },
];

function normalizeAmountByType(recordType, amount) {
  const type = recordTypes.find((item) => item.value === recordType);
  const abs = Math.abs(Number(amount || 0));
  return type?.sign === "minus" ? -abs : abs;
}

function groupDigits(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtK(v) {
  if (v === null || v === undefined) return "—";
  const sign = v < 0 ? "−" : "";
  return `${sign}${groupDigits(Math.abs(v * 1000))}`;
}

function fmtKpi(v) {
  if (v === null || v === undefined) return "—";
  const sign = v < 0 ? "−" : "";
  return `${sign}${groupDigits(Math.abs(v * 1000))} тыс. ₽`;
}

function annual(arr) {
  return arr ? Number(arr.reduce((s, v) => s + (v || 0), 0).toFixed(2)) : null;
}

function sumSeries(list) {
  return Array.from({ length: 12 }, (_, i) =>
    Number(list.reduce((s, a) => s + (a?.[i] || 0), 0).toFixed(2))
  );
}

const defs = [
  { type: "section", title: "P&L", hint: "Метод начисления" },
  { key: "revenue", title: "ВЫРУЧКА", hint: "Закрытые акты / услуги", derived: true },
  { key: "direct", title: "Прямые расходы", hint: "ФОТ + материалы", derived: true, accentLine: true, noChildren: true },
  { key: "fot", title: "ФОТ", hint: "Сдельный ФОТ по услугам", derived: true, subgroup: true },
  { key: "materials", title: "Материалы", hint: "Материалы и расходники", derived: true, subgroup: true },
  { key: "gm", title: "GM", hint: "Gross Margin: выручка − прямые расходы", accent: true, derived: true },
  { key: "commercial", title: "Коммерческие затраты", hint: "Маркетинг, продажи, лидогенерация, комиссии", derived: true },
  { key: "gmAfterCommercial", title: "GM после коммерческих", hint: "GM − коммерческие затраты", accent: true, derived: true },
  { key: "office", title: "Общие офисные затраты", hint: "АУП / инфраструктура / аллокация", derived: true },
  { key: "ebitda", title: "EBITDA", hint: "До амортизации, процентов и налогов", accent: true, derived: true },
  { key: "depr", title: "Амортизация", hint: "Расчетный износ техники и инструмента", derived: true },
  { key: "ebit", title: "EBIT", hint: "EBITDA − амортизация", derived: true },
  { key: "interest", title: "Проценты по кредитам", hint: "Процентные расходы", derived: true },
  { key: "taxes", title: "Налоги", hint: "Налоги периода", derived: true },
  { key: "ni", title: "Net Income", hint: "Чистая прибыль по начислению", accent: true, derived: true },
  { type: "waterline", title: "НИЖЕ ВАТЕРЛИНИИ", hint: "Переход от прибыли к деньгам" },
  { key: "ni", aliasKey: "cf_ni", title: "Net Income", hint: "Стартовая точка CF" },
  { key: "addbackDep", title: "+ Амортизация", hint: "Возврат бумажного расхода", derived: true },
  { key: "ar", title: "− Рост дебиторки", hint: "Заморозка денег у клиентов", derived: true },
  { key: "ap", title: "+ Рост кредиторки", hint: "Отсрочка поставщикам", derived: true },
  { key: "adv", title: "+ Рост авансов", hint: "Деньги до актов", derived: true },
  { key: "cfo", title: "CFO", hint: "Операционный денежный поток", accent: true, derived: true },
  { key: "capex", title: "CAPEX", hint: "Покупка техники / оборудования", derived: true },
  { key: "ofcf", title: "Operating FCF", hint: "Свободный операционный cash", accent: true, derived: true },
  { type: "section", title: "Финансовая деятельность", hint: "Кредиты и изъятия" },
  { key: "loans", title: "+ Кредиты полученные", hint: "Приток заемных денег", derived: true },
  { key: "principal", title: "− Погашение тела кредита", hint: "Principal", derived: true },
  { key: "owners", title: "− Изъятия / дивиденды", hint: "Вывод денег собственником", derived: true },
  { key: "ncc", title: "Net Cash Change", hint: "Изменение денег", accent: true, derived: true },
  { type: "section", title: "Касса и резервы", hint: "Остатки и доступный cash" },
  { key: "cashBegin", title: "Cash Begin", hint: "Деньги на начало", derived: true },
  { key: "cashEnd", title: "Cash End", hint: "Деньги на конец", derived: true },
  { key: "reserve", title: "Неснижаемый остаток", hint: "Буфер бизнеса", derived: true },
  { key: "distributable", title: "Доступно к изъятию", hint: "Свободный cash после резерва", accent: true, final: true, derived: true },
];

const officeRows = [
  { type: "section", title: "Офис / общие затраты", hint: "Полная стоимость управленческой инфраструктуры" },
  { title: "Аренда", values: Array(12).fill(-0.12), hint: "Аренда офиса" },
  { title: "Оклады офиса / АУП", values: Array.from({ length: 12 }, (_, i) => Number((-0.18 - i * 0.003).toFixed(2))), hint: "Административный ФОТ" },
  { title: "Бухгалтерия / экономист", values: Array(12).fill(-0.06), hint: "Финансовая функция" },
  { title: "Связь", values: Array(12).fill(-0.02), hint: "Телефония / интернет" },
  { title: "Софт / подписки", values: Array.from({ length: 12 }, (_, i) => Number((-0.04 - i * 0.001).toFixed(2))), hint: "CRM / учет / сервисы" },
  { title: "Прочие административные", values: Array.from({ length: 12 }, (_, i) => Number((-0.06 - i * 0.002).toFixed(2))), hint: "Остальные расходы" },
];

const officeTotal = sumSeries(officeRows.filter((r) => r.values).map((r) => r.values));
officeRows.push(
  {
    title: "Итого офис",
    values: officeTotal,
    hint: "Полная стоимость офиса",
    accent: true,
    formulaSpec: {
      lines: [
        { sign: "", label: "Аренда" },
        { sign: "+", label: "Оклады офиса / АУП" },
        { sign: "+", label: "Бухгалтерия" },
        { sign: "+", label: "Связь" },
        { sign: "+", label: "Софт" },
        { sign: "+", label: "Прочие" },
      ],
      result: "Итого офис",
      note: "Сумма административных расходов.",
    },
  },
  { title: "Аллоцировано на клиентов", values: Array.from({ length: 12 }, (_, i) => Number((0.42 + i * 0.009).toFixed(2))), hint: "Разнесено на клиентов" },
  {
    title: "Нераспределено",
    values: Array.from({ length: 12 }, (_, i) => Number((-0.06 - i * 0.001).toFixed(2))),
    hint: "Осталось на уровне бизнеса",
    formulaSpec: {
      lines: [
        { sign: "", label: "Итого офис" },
        { sign: "−", label: "Аллоцировано на клиентов" },
      ],
      result: "Нераспределено",
      note: "Остаток офисных затрат.",
    },
  }
);

function formula(key, children, entity) {
  const sumF = (result, note) =>
    children?.length ? { lines: children.map((l, i) => ({ sign: i ? "+" : "", label: l })), result, note } : null;

  switch (key) {
    case "revenue": return sumF("ВЫРУЧКА", entity === "business" ? "Свод по клиентам." : "Сумма по услугам.");
    case "direct": return { lines: [{ sign: "", label: "ФОТ" }, { sign: "+", label: "Материалы" }], result: "Прямые расходы", note: "Себестоимость объектов." };
    case "fot": return sumF("ФОТ", entity === "business" ? "Свод ФОТ по клиентам." : "ФОТ по услугам.");
    case "materials": return sumF("Материалы", entity === "business" ? "Свод материалов по клиентам." : "Материалы по услугам.");
    case "gm": return { lines: [{ sign: "", label: "ВЫРУЧКА" }, { sign: "−", label: "Прямые расходы" }], result: "GM", note: "Gross Margin / валовая маржа." };
    case "commercial": return sumF("Коммерческие затраты", entity === "business" ? "Маркетинг / продажи по клиентам." : "Маркетинг / продажи по услугам.");
    case "gmAfterCommercial": return { lines: [{ sign: "", label: "GM" }, { sign: "−", label: "Коммерческие затраты" }], result: "GM после коммерческих", note: "Маржа после привлечения и продаж." };
    case "office": return sumF("Общие офисные затраты", entity === "business" ? "Офисная нагрузка по клиентам." : "Аллокация офиса по услугам.");
    case "ebitda": return { lines: [{ sign: "", label: "GM после коммерческих" }, { sign: "−", label: "Общие офисные затраты" }], result: "EBITDA", note: "Операционная прибыль до амортизации." };
    case "depr": return sumF("Амортизация", "Сумма амортизации.");
    case "ebit": return { lines: [{ sign: "", label: "EBITDA" }, { sign: "−", label: "Амортизация" }], result: "EBIT", note: "Операционная прибыль после амортизации." };
    case "interest": return sumF("Проценты по кредитам", "Сумма процентной нагрузки.");
    case "taxes": return sumF("Налоги", "Сумма налогов.");
    case "ni": return { lines: [{ sign: "", label: "EBIT" }, { sign: "−", label: "Проценты" }, { sign: "−", label: "Налоги" }], result: "Net Income", note: "Чистая прибыль." };
    case "addbackDep": return { lines: [{ sign: "+", label: "Амортизация" }], result: "+ Амортизация", note: "Возврат бумажного расхода." };
    case "cfo": return { lines: [{ sign: "", label: "Net Income" }, { sign: "+", label: "Амортизация" }, { sign: "−", label: "Рост дебиторки" }, { sign: "+", label: "Рост кредиторки" }, { sign: "+", label: "Рост авансов" }], result: "CFO", note: "Операционный денежный поток." };
    case "capex": return sumF("CAPEX", "Инвестиции в активы.");
    case "ofcf": return { lines: [{ sign: "", label: "CFO" }, { sign: "−", label: "CAPEX" }], result: "Operating FCF", note: "Свободный операционный cash." };
    case "loans": return sumF("Кредиты полученные", "Приток заемных денег.");
    case "principal": return sumF("Погашение тела кредита", "Погашение principal.");
    case "owners": return sumF("Изъятия / дивиденды", "Вывод денег собственником.");
    case "ncc": return { lines: [{ sign: "", label: "Operating FCF" }, { sign: "+", label: "Кредиты полученные" }, { sign: "−", label: "Погашение тела кредита" }, { sign: "−", label: "Изъятия / дивиденды" }], result: "Net Cash Change", note: "Итоговое изменение денег." };
    case "cashBegin": return sumF("Cash Begin", "Сумма начальных остатков.");
    case "cashEnd": return { lines: [{ sign: "", label: "Cash Begin" }, { sign: "+", label: "Net Cash Change" }], result: "Cash End", note: "Деньги на конец." };
    case "reserve": return sumF("Неснижаемый остаток", "Сумма буфера.");
    case "distributable": return { lines: [{ sign: "", label: "Cash End" }, { sign: "−", label: "Неснижаемый остаток" }], result: "Доступно к изъятию", note: "Свободный остаток." };
    default: return null;
  }
}

function rowsFor(tab, expanded, model) {
  if (tab === "Офис") {
    return officeRows.map((row, i) =>
      row.type ? { ...row, key: `office-${i}` } : { ...row, type: "summary", key: `office-${i}`, total: annual(row.values) }
    );
  }

  const isBusiness = tab === "Весь бизнес";
  const root = isBusiness ? model.business : model.clients.find((c) => c.name === tab) || model.clients[0];
  const children = isBusiness ? model.clients : root?.services || [];
  const entity = isBusiness ? "business" : "client";
  const rows = [];

  defs.forEach((d, idx) => {
    if (d.type) {
      rows.push({ type: d.type, title: d.title, hint: d.hint, key: `${d.type}-${idx}` });
      return;
    }

    const values = root?.metrics?.[d.key] || Array(12).fill(0);

    rows.push({
      type: "summary",
      key: `sum-${d.aliasKey || d.key}-${idx}`,
      title: d.title,
      hint: d.hint,
      values,
      total: annual(values),
      accent: d.accent,
      final: d.final,
      formulaSpec: formula(d.key, root?.childLabels || [], entity),
      accentLine: d.accentLine,
    });

    const shouldDetail = expanded && !d.noChildren;
    if (shouldDetail) {
      children.forEach((child, cidx) => {
        const childValues = child.metrics[d.key] || Array(12).fill(0);
        rows.push({
          type: "child",
          key: `child-${d.aliasKey || d.key}-${child.name}-${idx}-${cidx}`,
          title: child.name,
          hint: isBusiness ? `${child.name}: свод из вкладки клиента.` : `${child.name}: показатель по услуге / договору.`,
          values: childValues,
          total: annual(childValues),
          formulaSpec: isBusiness ? formula(d.key, child.childLabels, "client") : d.derived ? formula(d.key, null, "service") : null,
        });
      });
    }
  });

  return rows;
}

function metric(rows, title) {
  return rows.find((r) => r.type === "summary" && r.title === title);
}

function kpis(tab, rows) {
  if (tab === "Офис") {
    return [
      ["Итого офис", fmtKpi(metric(rows, "Итого офис")?.total), "стоимость офиса"],
      ["Аллоцировано", fmtKpi(metric(rows, "Аллоцировано на клиентов")?.total), "на клиентов"],
      ["Нераспределено", fmtKpi(metric(rows, "Нераспределено")?.total), "на бизнесе"],
      ["Статей", "6", "офисных статей"],
    ];
  }

  return [
    ["Выручка", fmtKpi(metric(rows, "ВЫРУЧКА")?.total), "итого"],
    ["GM", fmtKpi(metric(rows, "GM")?.total), "после прямых"],
    ["EBITDA", fmtKpi(metric(rows, "EBITDA")?.total), "после коммерч. и офиса"],
    ["Доступно", fmtKpi(metric(rows, "Доступно к изъятию")?.total), "после резерва"],
  ];
}

function Icon({ type, className = "h-4 w-4" }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  if (type === "building") return <svg {...p}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M7 7h.01"/><path d="M12 7h.01"/><path d="M17 7h.01"/></svg>;
  if (type === "info") return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
  return <svg {...p}><path d="M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/></svg>;
}

function Kpi({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] text-slate-500">{label}</div>
          <div className="mt-1 text-[20px] font-black tracking-tight text-emerald-600">{value}</div>
          <div className="mt-1 text-[11px] text-slate-400">{hint}</div>
        </div>
        <div className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
          <Icon type="info" className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function Hint({ hint }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Icon type="info" className="ml-1 h-3.5 w-3.5 text-slate-400" />
      <span className="pointer-events-none absolute left-0 top-5 z-30 hidden w-64 rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-4 text-slate-600 shadow-xl group-hover:block">
        {hint}
      </span>
    </span>
  );
}

function Formula({ spec }) {
  if (!spec) return null;

  return (
    <span className="group relative inline-flex">
      <span className="cursor-default rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
        fx
      </span>
      <span className="pointer-events-none absolute right-0 top-6 z-40 hidden w-64 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xl group-hover:block">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Логика расчёта</div>
        <div className="mt-2 space-y-1 text-xs">
          {spec.lines.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`inline-flex min-w-[14px] justify-center font-black ${l.sign === "−" ? "text-rose-600" : "text-emerald-600"}`}>
                {l.sign || "+"}
              </span>
              <span className="text-slate-700">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-slate-200 pt-2">
          <div className="text-[10px] text-slate-400">Результат</div>
          <div className="font-black text-slate-900">{spec.result}</div>
        </div>
        {spec.note && <div className="mt-2 text-[11px] leading-4 text-slate-500">{spec.note}</div>}
      </span>
    </span>
  );
}

function DataEntryPanel({ open, onClose, dictionaries, onSaved }) {
  const [tab, setTab] = useState("record");
  const [status, setStatus] = useState("");
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceClientId, setServiceClientId] = useState("");
  const [record, setRecord] = useState({
    year: 2026,
    month: 4,
    scenario: "fact",
    client_id: "",
    service_id: "",
    record_type: "revenue",
    amount: "",
    comment: "",
  });

  useEffect(() => {
    const firstClient = dictionaries.clients?.[0]?.id || "";
    setServiceClientId(firstClient);
    setRecord((prev) => ({
      ...prev,
      client_id: prev.client_id || firstClient,
    }));
  }, [dictionaries.clients]);

  useEffect(() => {
    const services = dictionaries.services?.filter((item) => item.client_id === record.client_id) || [];
    setRecord((prev) => ({
      ...prev,
      service_id: services[0]?.id || "",
    }));
  }, [record.client_id, dictionaries.services]);

  if (!open) return null;

  const selectedRecordType = recordTypes.find((item) => item.value === record.record_type);
  const availableServices = dictionaries.services?.filter((item) => item.client_id === record.client_id) || [];

  async function submitClient(event) {
    event.preventDefault();
    setStatus("Создаю клиента...");

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientName }),
    });

    const payload = await res.json();

    if (!payload.ok) {
      setStatus(`Ошибка: ${payload.reason}`);
      return;
    }

    setClientName("");
    setStatus("Клиент создан");
    await onSaved();
  }

  async function submitService(event) {
    event.preventDefault();
    setStatus("Создаю услугу...");

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: serviceName, client_id: serviceClientId }),
    });

    const payload = await res.json();

    if (!payload.ok) {
      setStatus(`Ошибка: ${payload.reason}`);
      return;
    }

    setServiceName("");
    setStatus("Услуга создана");
    await onSaved();
  }

  async function submitRecord(event) {
    event.preventDefault();
    setStatus("Сохраняю запись...");

    const normalizedAmount = normalizeAmountByType(record.record_type, record.amount);

    const res = await fetch("/api/financial-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...record,
        amount: normalizedAmount,
        service_id: selectedRecordType?.level === "client" ? null : record.service_id,
      }),
    });

    const payload = await res.json();

    if (!payload.ok) {
      setStatus(`Ошибка: ${payload.reason}`);
      return;
    }

    setRecord((prev) => ({ ...prev, amount: "", comment: "" }));
    setStatus("Запись сохранена. Обновляю таблицу...");
    await new Promise((resolve) => setTimeout(resolve, 250));
    await onSaved();
    setStatus("Запись сохранена. Таблица обновлена.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-blue-600">Финдир</div>
            <h2 className="text-2xl font-black">Ввод данных</h2>
            <p className="mt-1 text-xs text-slate-500">Создание клиентов, услуг и финансовых записей. Суммы вводятся в рублях.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
            Закрыть
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {[
              ["record", "Финансовая запись"],
              ["client", "Новый клиент"],
              ["service", "Новая услуга / договор"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setTab(value);
                  setStatus("");
                }}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${
                  tab === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}

            <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              Минусовые статьи можно вводить положительным числом: система сама поставит минус для ФОТ, материалов, налогов, CAPEX и т.д.
            </div>
          </div>

          <div>
            {tab === "record" && (
              <form onSubmit={submitRecord} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-xs font-bold text-slate-500">
                    Год
                    <input value={record.year} onChange={(e) => setRecord({ ...record, year: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
                  </label>
                  <label className="text-xs font-bold text-slate-500">
                    Месяц
                    <select value={record.month} onChange={(e) => setRecord({ ...record, month: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-500">
                    Сценарий
                    <select value={record.scenario} onChange={(e) => setRecord({ ...record, scenario: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                      <option value="fact">Факт</option>
                      <option value="plan">План</option>
                      <option value="forecast">Прогноз</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-500">
                    Сумма, ₽
                    <input value={record.amount} onChange={(e) => setRecord({ ...record, amount: e.target.value })} placeholder="120000" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-bold text-slate-500">
                    Клиент
                    <select value={record.client_id} onChange={(e) => setRecord({ ...record, client_id: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                      {(dictionaries.clients || []).map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-bold text-slate-500">
                    Услуга / договор
                    <select
                      value={record.service_id}
                      disabled={selectedRecordType?.level === "client"}
                      onChange={(e) => setRecord({ ...record, service_id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {availableServices.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-bold text-slate-500">
                    Показатель
                    <select value={record.record_type} onChange={(e) => setRecord({ ...record, record_type: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                      {recordTypes.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-bold text-slate-500">
                  Комментарий
                  <textarea value={record.comment} onChange={(e) => setRecord({ ...record, comment: e.target.value })} placeholder="Например: акт за апрель / закупка материалов / аванс клиента" className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
                </label>

                <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  Выбран показатель: <b>{selectedRecordType?.label}</b>.
                  {selectedRecordType?.level === "client" ? " Запись будет создана на уровне клиента без услуги." : " Запись будет создана по выбранной услуге / договору."}
                </div>

                <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
                  Сохранить запись
                </button>
              </form>
            )}

            {tab === "client" && (
              <form onSubmit={submitClient} className="space-y-4">
                <label className="block text-xs font-bold text-slate-500">
                  Название клиента
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Например: Новый заказчик" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
                </label>
                <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
                  Создать клиента
                </button>
              </form>
            )}

            {tab === "service" && (
              <form onSubmit={submitService} className="space-y-4">
                <label className="block text-xs font-bold text-slate-500">
                  Клиент
                  <select value={serviceClientId} onChange={(e) => setServiceClientId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                    {(dictionaries.clients || []).map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  Название услуги / договора
                  <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Например: Новая услуга" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
                </label>
                <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
                  Создать услугу
                </button>
              </form>
            )}

            {status && <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">{status}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialModelPreview() {
  const [model, setModel] = useState(getDemoModel());
  const [sourceInfo, setSourceInfo] = useState({ source: "demo", reason: "initial demo" });
  const [dictionaries, setDictionaries] = useState({ clients: [], services: [], periods: [] });
  const [entryOpen, setEntryOpen] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [activeTab, setActiveTab] = useState("РЭМП");
  const [mode, setMode] = useState("Факт + прогноз");
  const [showHints, setShowHints] = useState(true);
  const [expanded, setExpanded] = useState(true);

  async function loadModel() {
    try {
      const res = await fetch(`/api/financial-model?year=2026&mode=fact_forecast&t=${Date.now()}`, { cache: "no-store" });
      const payload = await res.json();

      if (payload?.model) {
        setModel(payload.model);
        setSourceInfo({ source: payload.source || payload.model.source, reason: payload.reason || payload.model.fallbackReason });
      }
    } catch (error) {
      setSourceInfo({ source: "demo", reason: error.message });
    }
  }

  async function loadDictionaries() {
    try {
      const res = await fetch(`/api/dictionaries?t=${Date.now()}`, { cache: "no-store" });
      const payload = await res.json();

      if (payload?.ok) {
        setDictionaries({
          company: payload.company,
          clients: payload.clients || [],
          services: payload.services || [],
          periods: payload.periods || [],
        });
      }
    } catch {
      // dictionaries are optional in demo mode
    }
  }

  async function reloadAll() {
    await Promise.all([loadModel(), loadDictionaries()]);
    setLastRefreshAt(new Date());
  }

  useEffect(() => {
    reloadAll();
  }, []);

  const dynamicTabs = useMemo(() => ["Весь бизнес", ...(model.clients || []).map((c) => c.name), "Офис"], [model]);
  const safeActiveTab = dynamicTabs.includes(activeTab) ? activeTab : dynamicTabs[0];
  const visibleRows = useMemo(() => rowsFor(safeActiveTab, expanded, model), [safeActiveTab, expanded, model]);
  const cards = useMemo(() => kpis(safeActiveTab, visibleRows), [safeActiveTab, visibleRows]);

  return (
    <>
      <DataEntryPanel
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        dictionaries={dictionaries}
        onSaved={reloadAll}
      />

      <div className="min-h-screen bg-slate-100 p-3 text-slate-950">
        <div className="mx-auto grid max-w-[1920px] gap-3 lg:grid-cols-[180px_1fr]">
          <aside className="rounded-3xl bg-[#061027] p-3 text-white shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Icon type="building" className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-blue-300">Финдир</div>
                <div className="text-base font-black">Финансы 2026</div>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              {dynamicTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                    safeActiveTab === tab ? "bg-blue-600 shadow-lg shadow-blue-900/40" : "hover:bg-white/10"
                  }`}
                >
                  <div className="text-sm font-black">{tab}</div>
                  <div className={`mt-0.5 text-[10px] leading-4 ${safeActiveTab === tab ? "text-blue-100" : "text-slate-400"}`}>
                    {tab === "Весь бизнес" ? "по клиентам" : tab === "Офис" ? "статьи офиса" : "по услугам"}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-black">
                <Icon type="waves" className="h-3.5 w-3.5 text-cyan-300" />
                Источник
              </div>
              <p className="mt-2 text-[11px] leading-4 text-slate-300">
                {sourceInfo.source === "supabase" ? "Данные загружены из Supabase." : `Демо-режим: ${sourceInfo.reason || "fallback"}`}
              </p>
            </div>
          </aside>

          <main className="min-w-0 space-y-3">
            <section className="rounded-3xl bg-white px-4 py-3 shadow-sm">
              <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                <div>
                  <div className="text-xs text-slate-500">Рабочий стол собственника</div>
                  <h1 className="mt-1 text-3xl font-black tracking-tight">
                    {safeActiveTab === "Офис" ? "Общие затраты / офис" : `${safeActiveTab}: финансовая модель`}
                  </h1>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Таблица в тыс. ₽. GM = Gross Margin / валовая маржа: выручка минус прямые расходы.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">2026</button>
                  <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">Апр</button>
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {modes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          mode === m ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <button onClick={reloadAll} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow hover:bg-slate-800">Обновить</button>
                  <button onClick={() => setEntryOpen(true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700">
                    Ввод данных
                  </button>
                  <button onClick={() => setExpanded(!expanded)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-blue-700">
                    {expanded ? "Свернуть детализацию" : "Развернуть детализацию"}
                  </button>
                  <button onClick={() => setShowHints(!showHints)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">
                    {showHints ? "Подсказки: вкл" : "Подсказки: выкл"}
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              {cards.map(([label, value, hint]) => (
                <Kpi key={label} label={label} value={value} hint={hint} />
              ))}
            </section>

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-lg font-black">Единая финансовая модель 12 месяцев</h2>
                  <p className="text-xs text-slate-500">
                    Все 12 месяцев + итог. Единица измерения: тыс. ₽. Источник: {sourceInfo.source}.{lastRefreshAt ? ` Обновлено: ${lastRefreshAt.toLocaleTimeString("ru-RU")}.` : ""}
                  </p>
                </div>
              </div>

              <div className="max-h-[68vh] w-full overflow-x-hidden overflow-y-auto">
                <table className="w-full table-fixed border-collapse text-[11px]">
                  <colgroup>
                    <col style={{ width: "20.2%" }} />
                    {model.months.map((m) => (
                      <col key={m} style={{ width: "5.65%" }} />
                    ))}
                    <col style={{ width: "6%" }} />
                  </colgroup>

                  <thead>
                    <tr className="sticky top-0 z-20 bg-slate-50 text-slate-500 shadow-sm">
                      <th className="p-2 text-left font-black">Показатель</th>
                      {model.months.map((month, i) => (
                        <th key={month} className={`p-1.5 text-right font-black ${i >= 4 ? "text-blue-600" : "text-slate-500"}`}>
                          <div>{month}</div>
                          <div className="text-[8px] font-medium uppercase">{i <= 3 ? "факт" : mode === "Факт" ? "—" : "план"}</div>
                        </th>
                      ))}
                      <th className="sticky right-0 z-30 border-l border-slate-200 bg-slate-50 p-1.5 text-right text-[12px] font-black text-slate-950">
                        ИТОГО
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.map((row) => {
                      if (row.type === "section") {
                        return (
                          <tr key={row.key} className="bg-slate-950 text-white">
                            <td colSpan={14} className="px-3 py-2 text-xs font-black uppercase">
                              {row.title}
                              {showHints && <span className="ml-2 text-[10px] font-normal normal-case text-slate-400">{row.hint}</span>}
                            </td>
                          </tr>
                        );
                      }

                      if (row.type === "waterline") {
                        return (
                          <tr key={row.key} className="bg-cyan-50">
                            <td colSpan={14} className="px-3 py-2 text-center text-xs font-black text-cyan-900">
                              ──── {row.title} ────
                              {showHints && <span className="ml-2 font-normal text-cyan-700">{row.hint}</span>}
                            </td>
                          </tr>
                        );
                      }

                      const isChild = row.type === "child";
                      const bg = row.final ? "bg-emerald-50" : row.accent ? "bg-blue-50" : row.accentLine ? "bg-slate-50" : "bg-white";
                      const py = isChild ? "py-1.5" : "py-2";
                      const nameClass = isChild ? "text-[11px] font-semibold text-slate-600" : "text-xs font-black text-slate-900";
                      const pad = isChild ? "pl-6" : "pl-3";

                      return (
                        <tr key={row.key} className={`${bg} border-b border-slate-100 hover:bg-amber-50/60`}>
                          <td className={`${pad} ${py} pr-1`}>
                            <div className="flex items-center justify-between gap-1">
                              <div className="min-w-0">
                                <div className={`truncate ${nameClass} ${row.final ? "text-emerald-700" : row.accent ? "text-blue-700" : ""}`}>
                                  {isChild ? "↳ " : ""}
                                  {row.title}
                                  {showHints && row.hint && <Hint hint={row.hint} />}
                                </div>
                              </div>
                              {row.formulaSpec && <Formula spec={row.formulaSpec} />}
                            </div>
                          </td>

                          {model.months.map((m, i) => {
                            const v = row.values?.[i];
                            const disabled = i >= 4 && mode === "Факт";
                            const color = disabled ? "text-slate-300" : v < 0 ? "text-rose-600" : "text-slate-900";

                            return (
                              <td key={`${row.key}-${m}`} className={`${py} px-1 text-right tabular-nums ${isChild ? "text-[10px]" : "text-[11px] font-semibold"} ${color}`}>
                                {disabled ? "—" : fmtK(v)}
                              </td>
                            );
                          })}

                          <td className={`sticky right-0 border-l border-slate-200 ${bg} ${py} px-2 text-right tabular-nums ${isChild ? "text-[11px] font-black" : "text-[13px] font-black"} ${row.total !== null && row.total < 0 ? "text-rose-700" : row.final ? "text-emerald-700" : "text-slate-950"}`}>
                            {row.total === null ? "—" : fmtK(row.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
