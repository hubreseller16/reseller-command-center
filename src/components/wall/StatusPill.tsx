import { Badge } from "@/components/ui/badge";

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  uploaded: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  processing: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  open: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  paused: "bg-muted text-muted-foreground border-border",
  refunded: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  expired: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  critical: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const DOT: Record<string, string> = {
  emerald: "bg-emerald-500", amber: "bg-amber-500", sky: "bg-sky-500", rose: "bg-rose-500", muted: "bg-muted-foreground",
};

function tone(cls: string) {
  if (cls.includes("emerald")) return DOT.emerald;
  if (cls.includes("amber")) return DOT.amber;
  if (cls.includes("sky")) return DOT.sky;
  if (cls.includes("rose")) return DOT.rose;
  return DOT.muted;
}

export function StatusPill({ value, colorMap }: { value: string; colorMap?: Record<string, string> }) {
  const cls = (colorMap && colorMap[value]) ?? STATUS_COLORS[value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone(cls)}`} aria-hidden />
      {value}
    </Badge>
  );
}

/** Legend explaining every status tone used across the module. */
export function StatusLegend({ values }: { values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border px-5 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</span>
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${tone(STATUS_COLORS[v] ?? "")}`} aria-hidden />
          {v}
        </span>
      ))}
    </div>
  );
}
