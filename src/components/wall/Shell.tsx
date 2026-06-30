import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Package, KeyRound, Repeat, Users, ShieldCheck, BadgeCheck,
  ShoppingCart, Wallet, Percent, BarChart3, FileBarChart, ScrollText, Bell,
  Headphones, Settings, ChevronDown, Search, Crown,
} from "lucide-react";
import { SubBar } from "./SubBar";

export type WallNavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
export type WallNavGroup = { label: string; icon: React.ComponentType<{ className?: string }>; items: WallNavItem[] } | WallNavItem;

export const NAV: WallNavGroup[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Catalog", icon: Package, items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/licenses", label: "Licenses", icon: KeyRound },
      { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
    ],
  },
  {
    label: "People", icon: Users, items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/kyc", label: "KYC", icon: ShieldCheck },
      { to: "/approvals", label: "Approvals", icon: BadgeCheck },
    ],
  },
  {
    label: "Commerce", icon: ShoppingCart, items: [
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/wallet", label: "Wallet", icon: Wallet },
      { to: "/commission", label: "Commission", icon: Percent },
    ],
  },
  {
    label: "Insights", icon: BarChart3, items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/audit", label: "Audit", icon: ScrollText },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  { to: "/support", label: "Support", icon: Headphones },
  { to: "/settings", label: "Settings", icon: Settings },
];

function isGroup(n: WallNavGroup): n is { label: string; icon: React.ComponentType<{ className?: string }>; items: WallNavItem[] } {
  return (n as { items?: WallNavItem[] }).items !== undefined;
}

function NavDropdown({ group }: { group: { label: string; icon: React.ComponentType<{ className?: string }>; items: WallNavItem[] } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = group.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const Icon = group.icon;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors ${
          active ? "bg-primary-soft text-primary" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        {group.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-primary-soft text-primary" }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <ItemIcon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="mr-2 flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Crown className="h-4 w-4" />
          </span>
          <div className="hidden sm:block">
            <div className="text-[13px] font-bold leading-tight">Software Vala</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reseller Manager</div>
          </div>
        </Link>

        <nav className="ml-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {NAV.map((n) =>
            isGroup(n) ? (
              <NavDropdown key={n.label} group={n} />
            ) : (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                activeProps={{ className: "bg-primary-soft text-primary" }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search Walls, resellers, orders…"
              className="h-9 w-[280px] rounded-md border border-border bg-surface pl-8 pr-3 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button aria-label="Notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-accent">
            <Bell className="h-4 w-4" />
          </button>
          <div className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold ring-2 ring-background">SV</div>
        </div>
      </div>
    </header>
  );
}

export function WallShell({ children }: { children: ReactNode }) {
  // Lazy import to avoid circular reference with SubBar (which imports NAV from this file).
  // SubBar is a sibling module so a direct import is fine here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SubBar } = require("./SubBar") as typeof import("./SubBar");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <SubBar />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}

export function WallHeader({
  eyebrow, title, subtitle, actions,
}: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>}
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
