import Link from "next/link";
import type { ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ children, className, as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={cx("rounded-2xl border border-line bg-raised p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>{children}</As>;
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink">{title}</h1>
        {children && <div className="mt-1 max-w-2xl text-ink-soft">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const btn = {
  primary: "bg-brand text-brand-ink hover:bg-brand-strong",
  secondary: "border border-line bg-surface text-ink hover:border-ink-muted",
  ghost: "text-ink-soft hover:bg-surface hover:text-ink",
  danger: "border border-bad/40 text-bad hover:bg-bad/10",
};
export type BtnVariant = keyof typeof btn;
export const buttonClass = (v: BtnVariant = "primary", size: "sm" | "md" = "md") =>
  cx("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm", btn[v]);

export function LinkButton({ href, children, variant = "primary", size = "md" }: { href: string; children: ReactNode; variant?: BtnVariant; size?: "sm" | "md" }) {
  return <Link href={href} className={buttonClass(variant, size)}>{children}</Link>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "good" | "warn" | "bad" }) {
  const tones = { neutral: "bg-surface text-ink-soft border-line", brand: "bg-brand-soft text-brand border-brand/20", good: "bg-good/10 text-good border-good/30", warn: "bg-warn/10 text-warn border-warn/30", bad: "bg-bad/10 text-bad border-bad/30" };
  return <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

/** Hero number. A single value - no chart needed. */
export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="tabular mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

/** Mastery state with icon + label (status colour never carries meaning alone). */
export function StateChip({ state }: { state: "not_started" | "learning" | "weak" | "mastered" }) {
  const map = {
    mastered: { icon: "✓", label: "Mastered", cls: "text-good border-good/30 bg-good/10" },
    learning: { icon: "◐", label: "Learning", cls: "text-ink-soft border-line bg-surface" },
    weak: { icon: "!", label: "Needs work", cls: "text-bad border-bad/30 bg-bad/10" },
    not_started: { icon: "○", label: "Not started", cls: "text-ink-muted border-line bg-surface" },
  }[state];
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", map.cls)}>
      <span aria-hidden>{map.icon}</span>
      {map.label}
    </span>
  );
}
