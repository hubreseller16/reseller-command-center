import type { ReactNode } from "react";
import { X } from "lucide-react";

export type BulkAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
};

export function BulkBar({
  count, entity, actions, onAction, onClear,
}: {
  count: number;
  entity: string;              // "order" | "customer" | "product"
  actions: BulkAction[];
  onAction: (key: string) => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-border bg-popover px-3 py-2 shadow-lg backdrop-blur">
        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="px-1 text-[12px] font-semibold">
          {count} {entity}{count === 1 ? "" : "s"} selected
        </div>
        <span className="mx-1 h-5 w-px bg-border" />
        {actions.map((a) => {
          const Icon = a.icon;
          const destructive = a.variant === "destructive";
          return (
            <button
              key={a.key}
              onClick={() => onAction(a.key)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors ${
                destructive
                  ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
                  : "border border-border bg-surface hover:bg-accent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BulkHint({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-[11px] text-muted-foreground">{children}</div>;
}
