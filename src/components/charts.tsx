"use client";
import { useState, type ReactNode } from "react";

/**
 * Charts follow the dataviz method: single-series magnitude in one hue (no legend - the title names it),
 * thin marks, 4px rounded data-ends anchored on a square baseline, hairline grid, text in ink tokens,
 * hover tooltips, and a table view for every chart.
 */

function ViewToggle({ table, setTable }: { table: boolean; setTable: (v: boolean) => void }) {
  return (
    <div className="flex gap-1 text-xs" role="group" aria-label="Chart or table view">
      {["Chart", "Table"].map((l, i) => (
        <button key={l} onClick={() => setTable(i === 1)} aria-pressed={table === (i === 1)} className={`rounded-md px-2 py-1 ${table === (i === 1) ? "bg-page font-medium text-ink" : "text-ink-muted hover:text-ink"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function ChartFrame({ title, subtitle, children, table, setTable }: { title: string; subtitle?: string; children: ReactNode; table: boolean; setTable: (v: boolean) => void }) {
  return (
    <figure className="rounded-2xl border border-line p-4" style={{ background: "var(--viz-surface)" }}>
      <figcaption className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{title}</p>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <ViewToggle table={table} setTable={setTable} />
      </figcaption>
      {children}
    </figure>
  );
}

export interface BarRow {
  key: string;
  label: string;
  sublabel?: string;
  value: number | null; // 0-100
  note?: ReactNode;
}

/** Horizontal bars, 0-100%. Empty rows read "Not started" instead of a zero bar. */
export function BarList({ title, subtitle, rows, valueLabel = "%" }: { title: string; subtitle?: string; rows: BarRow[]; valueLabel?: string }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} setTable={setTable}>
      {table ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-muted">
            <tr><th className="py-1 font-medium">Item</th><th className="py-1 text-right font-medium">Value</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line">
                <td className="py-1.5 pr-2 text-ink">{r.label}{r.sublabel && <span className="block text-xs text-ink-muted">{r.sublabel}</span>}</td>
                <td className="tabular py-1.5 text-right text-ink-soft">{r.value === null ? "Not started" : `${r.value}${valueLabel}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]" onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
              <div className="min-w-0 text-sm">
                <p className="truncate text-ink" title={r.label}>{r.label}</p>
                {r.sublabel && <p className="truncate text-xs text-ink-muted">{r.sublabel}</p>}
              </div>
              <div className="relative flex h-6 items-center" title={`${r.label}: ${r.value === null ? "not started" : r.value + valueLabel}`}>
                {/* baseline */}
                <div className="absolute inset-y-0 left-0 w-px" style={{ background: "var(--viz-axis)" }} />
                {r.value === null ? (
                  <span className="pl-2 text-xs text-ink-muted">Not started</span>
                ) : (
                  <>
                    <div className="h-3.5 rounded-r-[4px]" style={{ width: `${Math.max(r.value, 0.5)}%`, background: "var(--viz-series)", opacity: hover && hover !== r.key ? 0.55 : 1 }} />
                    <span className="tabular ml-2 text-xs text-ink-soft">{r.value}{valueLabel}</span>
                    {r.note && <span className="ml-2">{r.note}</span>}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartFrame>
  );
}

export interface TrendPoint {
  key: string;
  label: string; // shown on x axis
  value: number; // 0-100
  detail?: string;
}

/** Line chart of percentages over time with crosshair tooltip. */
export function TrendLine({ title, subtitle, points }: { title: string; subtitle?: string; points: TrendPoint[] }) {
  const [table, setTable] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const W = 640, H = 220, L = 34, R = 12, T = 12, B = 28;
  const iw = W - L - R, ih = H - T - B;
  const x = (i: number) => L + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => T + ih - (v / 100) * ih;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${path} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const tickEvery = Math.max(1, Math.ceil(points.length / 6));
  const a = active !== null ? points[active] : null;
  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} setTable={setTable}>
      {points.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No completed quizzes yet.</p>
      ) : table ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-muted"><tr><th className="py-1 font-medium">When</th><th className="py-1 font-medium">Quiz</th><th className="py-1 text-right font-medium">Score</th></tr></thead>
          <tbody>{points.map((p) => <tr key={p.key} className="border-t border-line"><td className="py-1.5 text-ink-soft">{p.label}</td><td className="py-1.5 text-ink">{p.detail}</td><td className="tabular py-1.5 text-right text-ink-soft">{p.value}%</td></tr>)}</tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}: ${points.map((p) => `${p.label} ${p.value}%`).join(", ")}`}
            onMouseLeave={() => setActive(null)}
            onMouseMove={(e) => {
              const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const px = ((e.clientX - box.left) / box.width) * W;
              let best = 0;
              points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
              setActive(best);
            }}>
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth={1} />
                <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--viz-muted)">{v}</text>
              </g>
            ))}
            {points.map((p, i) => (i % tickEvery === 0 || i === points.length - 1) && (
              <text key={p.key} x={x(i)} y={H - 8} textAnchor={points.length > 1 && i === 0 ? "start" : points.length > 1 && i === points.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--viz-muted)">{p.label}</text>
            ))}
            {area && <path d={area} fill="var(--viz-series)" opacity={0.1} />}
            <path d={path} fill="none" stroke="var(--viz-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {a && <line x1={x(active!)} x2={x(active!)} y1={T} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />}
            {points.map((p, i) => (
              <circle key={p.key} cx={x(i)} cy={y(p.value)} r={i === active || i === points.length - 1 ? 5 : 4} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
            ))}
            {(() => {
              // End label sits on the side away from the incoming segment so it never collides with the line.
              const n = points.length - 1, v = points[n].value, prev = n > 0 ? points[n - 1].value : v;
              const below = prev > v ? v > 12 : v > 88;
              return <text x={x(n) - 8} y={y(v) + (below ? 18 : -10)} textAnchor="end" fontSize="12" className="fill-ink" style={{ paintOrder: "stroke", stroke: "var(--viz-surface)", strokeWidth: 3 }}>{v}%</text>;
            })()}
          </svg>
          {a && (
            <div className="pointer-events-none absolute top-0 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs shadow-sm"
              style={{ left: `min(calc(${(x(active!) / W) * 100}% + 8px), calc(100% - 12rem))` }}>
              <p className="font-medium text-ink">{a.value}%</p>
              <p className="text-ink-soft">{a.detail}</p>
              <p className="text-ink-muted">{a.label}</p>
            </div>
          )}
        </div>
      )}
    </ChartFrame>
  );
}
