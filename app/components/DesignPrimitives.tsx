"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Material = "metal" | "plastic" | "paper" | "acrylic";
type Depth = 0 | 1 | 2 | 3;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FloatingIsland({
  children,
  material = "plastic",
  depth = 2,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; material?: Material; depth?: Depth }) {
  return (
    <section className={cx("ds-island", `material-${material}`, `depth-${depth}`, className)} {...props}>
      {children}
    </section>
  );
}

export function InstrumentPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cx("ds-instrument", className)} {...props}>{children}</div>;
}

export function HardwareButton({
  children,
  tone = "ivory",
  compact = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "ivory" | "olive" | "blue" | "orange" | "dark";
  compact?: boolean;
}) {
  return (
    <button className={cx("ds-hardware-button", `tone-${tone}`, compact && "is-compact", className)} {...props}>
      <span className="ds-button-face">{children}</span>
    </button>
  );
}

export function ControlKey({
  icon: Icon,
  label,
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button className={cx("ds-control-key", active && "is-active", className)} aria-label={label} title={label} {...props}>
      <span className="ds-key-well"><Icon aria-hidden="true" /></span>
      <span className="ds-key-label">{label}</span>
    </button>
  );
}

export function StatusLamp({
  label,
  tone = "olive",
  pulse = false,
}: {
  label: string;
  tone?: "olive" | "amber" | "blue" | "red";
  pulse?: boolean;
}) {
  return (
    <span className={cx("ds-status-lamp", `tone-${tone}`, pulse && "is-pulsing")}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function TechnicalLabel({ children, index }: { children: ReactNode; index?: string }) {
  return (
    <span className="ds-technical-label">
      {index && <b>{index}</b>}
      {children}
    </span>
  );
}

export function ProgressMeter({ value, segments = 12, tone = "olive" }: { value: number; segments?: number; tone?: "olive" | "amber" | "blue" }) {
  const filled = Math.round((Math.min(Math.max(value, 0), 100) / 100) * segments);
  return (
    <span className={cx("ds-progress-meter", `tone-${tone}`)} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      {Array.from({ length: segments }, (_, index) => <i key={index} className={index < filled ? "is-filled" : ""} />)}
    </span>
  );
}

