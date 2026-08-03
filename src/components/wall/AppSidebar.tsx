import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Search, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, type WallNavItem } from "./nav";

const COLLAPSE_KEY = "sv:sidebar:collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });

  return { collapsed, toggleCollapsed };
}

type Group = { label: string; items: WallNavItem[] };

function split() {
  const primary: WallNavItem[] = [];
  const groups: Group[] = [];
  for (const n of NAV) {
    if ("items" in n) groups.push({ label: n.label, items: n.items });
    else primary.push(n);
  }
  return { primary, groups };
}

export function AppSidebar({
  collapsed, onToggleCollapsed,
}: { collapsed: boolean; onToggleCollapsed: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { primary, groups } = useMemo(() => split(), []);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query, groups]);

  const groupOpen = (label: string, items: WallNavItem[]) =>
    openGroups[label] ?? items.some((i) => isActive(i.to));

  const ItemLink = ({ item }: { item: WallNavItem }) => (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group/item flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200",
        collapsed && "justify-center px-0",
        isActive(item.to)
          ? "bg-primary/15 text-foreground ring-1 ring-primary/25"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b border-border px-3", collapsed && "justify-center px-0")}>
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow font-bold text-primary-foreground">
            <Crown className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">Software Vala</span>
              <span className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">Reseller Manager</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a Wall…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {primary.map((item) => <ItemLink key={item.to} item={item} />)}
        </div>

        {(filtered ?? groups).map((group) => {
          const open = filtered ? true : groupOpen(group.label, group.items);
          if (collapsed) {
            return (
              <div key={group.label} className="space-y-0.5 border-t border-border/60 pt-2">
                {group.items.map((item) => <ItemLink key={item.to} item={item} />)}
              </div>
            );
          }
          return (
            <div key={group.label}>
              <button
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {group.label}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => <ItemLink key={item.to} item={item} />)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
