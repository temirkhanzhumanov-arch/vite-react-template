import { useMemo, useState } from "react";
import "./App.css";

const STAGE_FACTORS = {
  "Не начат": 1.0,
  "Монтаж/кран": 1.1,
  "Стыковка/сварка": 1.15,
  "Риск/задержка": 1.35,
  "Завершен": 0.0,
};

function calcTier(tier) {
  const factor = STAGE_FACTORS[tier.stage] ?? 1;
  const remaining =
    tier.timeDays *
    (1 - tier.progress / 100) *
    factor;

  const duration =
    Math.ceil(Math.max(0, remaining)) +
    Number(tier.downtimeDays);

  const delay = Math.max(0, duration - tier.plannedDays);

  const laborCost =
    duration *
    tier.workers *
    tier.salaryPerDay;

  const machineCost =
    duration *
    tier.machineCostPerDay;

  const totalCost =
    tier.baseCost +
    laborCost +
    machineCost +
    Number(tier.extraCost);

  return {
    duration,
    delay,
    laborCost,
    machineCost,
    totalCost,
    status: delay > 0 ? "Отставание" : "В срок",
  };
}

export default function App() {
  const [tier, setTier] = useState({
    name: "Ярус 3",
    timeDays: 90,
    plannedDays: 80,
    progress: 45,
    workers: 120,
    salaryPerDay: 28000,
    machineCostPerDay: 900000,
    baseCost: 180000000,
    downtimeDays: 8,
    extraCost: 15000000,
    stage: "Монтаж/кран",
  });

  const result = useMemo(() => calcTier(tier), [tier]);

  function update(key, value) {
    setTier((prev) => ({
      ...prev,
      [key]: key === "stage" || key === "name" ? value : Number(value),
    }));
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <div className="eyebrow">BIM · Construction Phase</div>
          <h1>Моделирование строительной фазы</h1>
        </div>
        <div className={result.delay > 0 ? "pill danger" : "pill ok"}>
          {result.status}
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Входные данные</h2>

          <label>
            Название элемента / яруса
            <input
              value={tier.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>

          <label>
            Стадия работ
            <select
              value={tier.stage}
              onChange={(e) => update("stage", e.target.value)}
            >
              {Object.keys(STAGE_FACTORS).map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </label>

          <Slider
            label="Базовая длительность, дней"
            value={tier.timeDays}
            min={1}
            max={200}
            onChange={(v) => update("timeDays", v)}
          />

          <Slider
            label="Плановая длительность, дней"
            value={tier.plannedDays}
            min={1}
            max={200}
            onChange={(v) => update("plannedDays", v)}
          />

          <Slider
            label="Прогресс, %"
            value={tier.progress}
            min={0}
            max={100}
            onChange={(v) => update("progress", v)}
          />

          <Slider
            label="Количество рабочих"
            value={tier.workers}
            min={1}
            max={500}
            onChange={(v) => update("workers", v)}
          />

          <Slider
            label="Простой / форс-мажор, дней"
            value={tier.downtimeDays}
            min={0}
            max={60}
            onChange={(v) => update("downtimeDays", v)}
          />

          <NumberField
            label="Зарплата одного рабочего в день, ₸"
            value={tier.salaryPerDay}
            onChange={(v) => update("salaryPerDay", v)}
          />

          <NumberField
            label="Стоимость техники в день, ₸"
            value={tier.machineCostPerDay}
            onChange={(v) => update("machineCostPerDay", v)}
          />

          <NumberField
            label="Базовая стоимость работ, ₸"
            value={tier.baseCost}
            onChange={(v) => update("baseCost", v)}
          />

          <NumberField
            label="Дополнительные расходы, ₸"
            value={tier.extraCost}
            onChange={(v) => update("extraCost", v)}
          />
        </div>

        <div className="card">
          <h2>Результаты BIM-расчета</h2>

          <div className="kpi">
            <span>Объект</span>
            <b>{tier.name}</b>
          </div>

          <div className="kpi">
            <span>Расчетная длительность</span>
            <b>{result.duration} дней</b>
          </div>

          <div className="kpi">
            <span>Задержка</span>
            <b className={result.delay > 0 ? "red" : "green"}>
              {result.delay} дней
            </b>
          </div>

          <div className="kpi">
            <span>Стоимость труда</span>
            <b>{format(result.laborCost)} ₸</b>
          </div>

          <div className="kpi">
            <span>Стоимость техники</span>
            <b>{format(result.machineCost)} ₸</b>
          </div>

          <div className="total">
            <span>Итоговые расходы</span>
            <strong>{format(result.totalCost)} ₸</strong>
          </div>

          <div className="bar">
            <div style={{ width: `${tier.progress}%` }} />
          </div>

          <p className="note">
            Модель учитывает стадию работ, оставшийся объем, прогресс,
            простой, количество работников, оплату труда, технику и
            дополнительные расходы.
          </p>
        </div>
      </section>
    </main>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <label>
      <div className="row">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function format(value) {
  return Math.round(value).toLocaleString("ru-RU");
}
