import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function KPI({
  label, value, hint, icon: Icon, loading,
}: { label: string; value: string | number; hint?: string; icon?: React.ComponentType<{ className?: string }>; loading?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">
            {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted" /> : value}
          </div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon: Icon = Inbox, title, description, action, compact = false,
}: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-16"}`}>
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionCard({
  title, description, action, children,
}: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </Card>
  );
}

export function Btn({
  children, variant = "primary", size = "md", leading, onClick, type = "button",
}: {
  children: ReactNode; variant?: "primary" | "outline" | "ghost"; size?: "sm" | "md";
  leading?: ReactNode; onClick?: () => void; type?: "button" | "submit";
}) {
  const sizes = size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-4 text-[13px]";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-surface hover:bg-accent",
    ghost: "hover:bg-accent",
  } as const;
  return (
    <button type={type} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors ${sizes} ${variants[variant]}`}>
      {leading}
      {children}
    </button>
  );
}
