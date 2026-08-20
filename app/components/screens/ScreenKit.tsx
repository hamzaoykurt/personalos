import { ArrowRight, type LucideIcon, Plus } from "lucide-react";
import type { ReactNode } from "react";

export type SetAppState<T> = React.Dispatch<React.SetStateAction<T>>;

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function todayIso(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Tarihsiz";
  return new Intl.DateTimeFormat("tr-TR", options ?? { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ScreenHeader({ title, kicker, action, onAction, aside }: { title: string; kicker?: string; action?: string; onAction?: () => void; aside?: ReactNode }) {
  return <header className="os-screen-head">
    <div>{kicker && <span>{kicker}</span>}<h1>{title}</h1></div>
    <div className="os-screen-actions">{aside}{action && <button className="os-solid-button" onClick={onAction}><Plus />{action}</button>}</div>
  </header>;
}

export function SectionHead({ title, label, action, onAction }: { title: string; label?: string; action?: string; onAction?: () => void }) {
  return <div className="os-section-head"><div>{label && <span>{label}</span>}<h2>{title}</h2></div>{action && <button onClick={onAction}>{action}<ArrowRight /></button>}</div>;
}

export function EmptyView({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) {
  return <div className="os-empty"><span><Icon /></span><strong>{title}</strong>{action && <button onClick={onAction}>{action}<ArrowRight /></button>}</div>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const bounded = Math.min(100, Math.max(0, value));
  return <span className="os-progress" role="progressbar" aria-label={label ?? "İlerleme"} aria-valuenow={bounded} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${bounded}%` }} /></span>;
}
