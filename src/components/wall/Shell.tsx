import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Package, KeyRound, Repeat, Users, ShieldCheck, BadgeCheck,
  ShoppingCart, Wallet, Percent, BarChart3, FileBarChart, ScrollText, Bell,
  Headphones, Settings, ChevronDown, Search, Crown, Inbox, User, LogOut,
  Sun, Moon, LifeBuoy, CheckCheck, Hash, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import { SubBar } from "./SubBar";
import { useSearchEntries, requestOpen, type SearchEntry } from "@/lib/searchIndex";

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
      { to: "/resellers", label: "Resellers", icon: Users },
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
        title={group.label}
        className={`inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-semibold transition-colors ${
          active ? "bg-primary-soft text-primary" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="hidden lg:inline">{group.label}</span>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface hover:bg-accent lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/" className="mr-2 flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Crown className="h-4 w-4" />
            </span>
            <div className="hidden xl:block">
              <div className="text-[13px] font-bold leading-tight">Software Vala</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reseller Manager</div>
            </div>
          </Link>

          <nav className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex lg:hidden">
            {NAV.map((n) =>
              isGroup(n) ? (
                <NavDropdown key={n.label} group={n} />
              ) : (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  activeProps={{ className: "bg-primary-soft text-primary" }}
                  title={n.label}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{n.label}</span>
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <GlobalSearch />
            <NotificationsMenu />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Rendered as a sibling of <header> — the header uses backdrop-filter,
          which creates a containing block for descendants and would trap the
          drawer inside the 56px bar. Mounting outside keeps `fixed inset-0`
          anchored to the viewport. */}
      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isActive = (to: string) => pathname === to || (to !== "/" && pathname.startsWith(to + "/"));

  return (
    <div className="fixed inset-0 z-[90] md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] flex-col border-r border-border bg-popover text-popover-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[13px] font-bold leading-tight">Software Vala</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reseller Manager</div>
            </div>
          </div>
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {NAV.map((n) => {
            if (!isGroup(n)) {
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold ${
                    isActive(n.to) ? "bg-primary-soft text-primary" : "hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            }
            const GroupIcon = n.icon;
            return (
              <div key={n.label} className="mt-3 first:mt-0">
                <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <GroupIcon className="h-3 w-3" />
                  {n.label}
                </div>
                {n.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                        isActive(item.to) ? "bg-primary-soft text-primary" : "hover:bg-accent"
                      }`}
                    >
                      <ItemIcon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export function WallShell({ children }: { children: ReactNode }) {
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

/* ============================================================
   Global Search — command-menu style, navigates to any Wall
============================================================ */

type FlatNav = { to: string; label: string; group?: string; icon: React.ComponentType<{ className?: string }> };
function flattenNav(): FlatNav[] {
  const out: FlatNav[] = [];
  for (const n of NAV) {
    if (isGroup(n)) {
      for (const it of n.items) out.push({ ...it, group: n.label });
    } else {
      out.push({ to: n.to, label: n.label, icon: n.icon });
    }
  }
  return out;
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

function useLocalList(key: string) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try { setList(JSON.parse(window.localStorage.getItem(key) ?? "[]")); } catch { /* ignore */ }
  }, [key]);
  const write = (next: string[]) => {
    setList(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return [list, write] as const;
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useLocalList("wall:search:recent");
  const [saved, setSaved] = useLocalList("wall:search:saved");
  const navigate = useNavigate();
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const navItems = useMemo(() => flattenNav(), []);
  const records = useSearchEntries();


  type Row =
    | { kind: "nav"; item: FlatNav }
    | { kind: "record"; item: SearchEntry };

  const results = useMemo<Row[]>(() => {
    const s = q.trim().toLowerCase();
    const navRows: Row[] = navItems
      .filter((i) =>
        !s
          ? true
          : i.label.toLowerCase().includes(s)
            || (i.group ?? "").toLowerCase().includes(s)
            || i.to.toLowerCase().includes(s),
      )
      .map((item) => ({ kind: "nav", item }));

    const recRows: Row[] = records
      .filter((r) =>
        !s
          ? false
          : r.label.toLowerCase().includes(s)
            || (r.sub ?? "").toLowerCase().includes(s)
            || (r.hay ?? "").toLowerCase().includes(s)
            || r.scope.toLowerCase().includes(s),
      )
      .slice(0, 30)
      .map((item) => ({ kind: "record", item }));

    return [...recRows, ...navRows];
  }, [navItems, records, q]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { setActive(0); }, [q, open]);

  const pick = (row: Row) => {
    const term = q.trim();
    if (term) setRecent([term, ...recent.filter((r) => r !== term)].slice(0, 6));
    setOpen(false);
    setQ("");
    if (row.kind === "nav") {
      navigate({ to: row.item.to });
    } else {
      requestOpen(row.item.scope, row.item.id);
      navigate({ to: row.item.route });
    }
  };

  const isSaved = saved.includes(q.trim());
  const toggleSaved = () => {
    const term = q.trim();
    if (!term) return;
    setSaved(isSaved ? saved.filter((s) => s !== term) : [term, ...saved].slice(0, 8));
  };


  const recordCount = results.filter((r) => r.kind === "record").length;

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border border-border bg-background px-1 py-0.5 text-[9px] font-medium lg:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            ref={ref}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
          >
            <div className="relative border-b border-border">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  else if (e.key === "Enter" && results[active]) { e.preventDefault(); pick(results[active]); }
                }}
                placeholder="Search Walls, resellers, orders, customers…"
                className="h-12 w-full bg-transparent pl-10 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={toggleSaved}
                  aria-pressed={isSaved}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border px-2 py-1 text-[10px] font-semibold transition-colors ${isSaved ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent"}`}
                >
                  {isSaved ? "Saved" : "Save search"}
                </button>
              )}
            </div>
            {!q.trim() && (saved.length > 0 || recent.length > 0) && (
              <div className="space-y-2 border-b border-border px-3 py-2.5">
                {saved.length > 0 && (
                  <SearchChips title="Saved searches" items={saved} onPick={setQ} onRemove={(t) => setSaved(saved.filter((s) => s !== t))} />
                )}
                {recent.length > 0 && (
                  <SearchChips title="Recent" items={recent} onPick={setQ} onRemove={(t) => setRecent(recent.filter((s) => s !== t))} />
                )}
              </div>
            )}
            <div className="max-h-[420px] overflow-y-auto py-1">

              {results.length === 0 ? (
                <div className="px-3 py-10 text-center text-xs text-muted-foreground">
                  {q ? `No matches for "${q}"` : "Start typing to search records & walls…"}
                </div>
              ) : (
                results.map((row, idx) => {
                  const selected = idx === active;
                  if (row.kind === "nav") {
                    const Icon = row.item.icon;
                    return (
                      <button
                        key={`nav-${row.item.to}`}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => pick(row)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${selected ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 font-medium">{row.item.label}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.item.group ?? "Wall"}</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={`rec-${row.item.scope}-${row.item.id}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => pick(row)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${selected ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
                    >
                      <Hash className="h-4 w-4 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{row.item.label}</span>
                        {row.item.sub && <span className="block truncate text-[11px] text-muted-foreground">{row.item.sub}</span>}
                      </span>
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">{row.item.scope}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-surface/60 px-3 py-1.5 text-[10px] text-muted-foreground">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <span>{recordCount > 0 ? `${recordCount} record${recordCount === 1 ? "" : "s"} · ` : ""}{results.length} total</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchChips({
  title, items, onPick, onRemove,
}: { title: string; items: string[]; onPick: (t: string) => void; onRemove: (t: string) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pl-2.5 pr-1 text-[11px] font-medium"
          >
            <button type="button" onClick={() => onPick(t)} className="max-w-[160px] truncate hover:text-primary">{t}</button>
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onRemove(t)}
              className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}


/* ============================================================
   Notifications — dropdown with empty state (API-ready)
============================================================ */

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[360px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div className="text-sm font-semibold">Notifications</div>
            <button
              onClick={() => toast.info("All notifications marked as read")}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="grid place-items-center gap-2 px-4 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">You're all caught up</div>
            <div className="max-w-[240px] text-xs text-muted-foreground">
              System-wide alerts, approvals and reseller activity will land here.
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); navigate({ to: "/notifications" }); }}
            className="block w-full border-t border-border px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-accent"
          >
            Open Notifications Wall →
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Avatar menu — profile / theme / settings / sign out placeholders
============================================================ */

function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    toast.success(`${next ? "Dark" : "Light"} mode`);
  };

  const items: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; danger?: boolean }> = [
    { icon: User, label: "Profile", onClick: () => toast.info("Profile — coming with auth") },
    { icon: Settings, label: "Preferences", onClick: () => { setOpen(false); navigate({ to: "/settings" }); } },
    { icon: dark ? Sun : Moon, label: dark ? "Light mode" : "Dark mode", onClick: toggleTheme },
    { icon: LifeBuoy, label: "Help & Support", onClick: () => { setOpen(false); navigate({ to: "/support" }); } },
    { icon: LogOut, label: "Sign out", onClick: () => toast.info("Sign out — coming with auth"), danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold ring-2 ring-background transition-transform hover:scale-105"
      >
        SV
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[240px] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center gap-3 border-b border-border px-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">SV</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Software Vala Boss</div>
              <div className="truncate text-[11px] text-muted-foreground">Full-access owner</div>
            </div>
          </div>
          <div className="py-1">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.label}
                  onClick={() => { setOpen(false); it.onClick(); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                    it.danger ? "text-destructive" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
