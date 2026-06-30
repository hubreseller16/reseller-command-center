import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronRight, ArrowLeft, Home, Lock, ShieldCheck } from "lucide-react";
import { NAV, type WallNavItem } from "./Shell";

/**
 * Flatten NAV into a path -> {label, group?} lookup so breadcrumbs render
 * the same labels as the Top Bar. Pure UI — no backend.
 */
function flattenNav(): Record<string, { label: string; group?: string }> {
  const map: Record<string, { label: string; group?: string }> = {};
  for (const n of NAV ?? []) {
    if ("items" in n) {
      for (const i of n.items as WallNavItem[]) map[i.to] = { label: i.label, group: n.label };
    } else {
      map[n.to] = { label: n.label };
    }
  }
  return map;
}

/**
 * UI-only permission badge. Real role checks will be wired by the parent
 * Boss Panel later; for now we display a static "Boss" capability chip so
 * the workspace shows where gating will appear.
 */
function PermissionBadge() {
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
      <ShieldCheck className="h-3 w-3 text-primary" />
      <span className="text-foreground">Boss</span>
      <span className="text-muted-foreground/70">·</span>
      <span>Full Access</span>
    </div>
  );
}

export function SubBar() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/") {
    // Dashboard: show only the permission chip, no breadcrumb / back.
    return (
      <div className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto flex h-10 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">Dashboard</span>
          </nav>
          <PermissionBadge />
        </div>
      </div>
    );
  }

  const current = NAV_MAP[pathname];

  return (
    <div className="border-b border-border/60 bg-surface/40">
      <div className="mx-auto grid h-12 max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[12px] font-semibold text-foreground/80 transition-colors hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 overflow-hidden text-[12px]">
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          {current?.group && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="truncate font-medium text-muted-foreground">{current.group}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-semibold text-foreground">{current?.label ?? prettify(pathname)}</span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary md:inline-flex">
            <Lock className="h-3 w-3" />
            Read · Write · Approve
          </span>
          <PermissionBadge />
        </div>
      </div>
    </div>
  );
}

function prettify(p: string) {
  const seg = p.replace(/^\//, "").split("/")[0] ?? "";
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : "Page";
}
