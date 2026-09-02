import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Filter, MoreHorizontal, Trash2, Eye, Download, Upload, ArrowUp, ArrowDown,
  ArrowDownUp, X, Link2, Command as CommandIcon, RefreshCw, Clock, MessageSquare, Tag as TagIcon,
  ChevronRight,
} from "lucide-react";
import { WallHeader } from "@/components/wall/Shell";
import { Btn, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { BulkBar } from "@/components/wall/BulkBar";
import { StatusPill, StatusLegend } from "@/components/wall/StatusPill";
import {
  ColumnManager, DensitySwitcher, ExportDialog, FilterChips, ImportDialog, Pagination,
  SavedViews, TableSkeleton, ToolBtn, type Density, type SavedView,
} from "@/components/wall/DataTools";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { recordAction } from "@/lib/recordAction";
import {
  syncDelete, syncInsert, syncInsertMany, syncList, syncUpdate, syncUpdateMany, type WallSync,
} from "@/lib/wallTable";
import { useRegisterSearchScope, consumePendingOpen } from "@/lib/searchIndex";

/* eslint-disable @typescript-eslint/no-explicit-any */

export { StatusPill };

export type WallField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  help?: string;
};

export type WallColumn = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  sortable?: boolean;
  render?: (row: any) => ReactNode;
};

export type WallFilterDef = { key: string; label: string; options: readonly string[] };

export type WallKpi = {
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  compute: (rows: any[]) => string | number;
};

export type WallBulkAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
  patch?: Record<string, any>;
  confirmTitle?: string;
  confirmDescription?: string;
};

export type WallRowAction = {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  patch?: Record<string, any>;
  destructive?: boolean;
};

export type WallConfig = {
  scope: string;
  entity: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryLabel: string;
  route: string;
  seed: any[];
  /** When set, the Wall reads and writes real rows in this database table. */
  sync?: WallSync;
  columns: WallColumn[];
  filters: WallFilterDef[];
  kpis: WallKpi[];
  bulkActions: WallBulkAction[];
  rowActions?: WallRowAction[];
  formFields: WallField[];
  searchFields: string[];
  primaryField: string;
  subField?: string;
  statusField?: string;
  statusColorMap?: Record<string, string>;
  sortOptions?: { key: string; label: string; compare: (a: any, b: any) => number }[];
  renderDetail?: (row: any) => ReactNode;
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const lsKey = (scope: string, part: string) => `wall:${scope}:${part}`;

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
  }, [key, v]);
  return [v, setV] as const;
}

export function GenericWall({ config }: { config: WallConfig }) {
  const [rows, setRows] = useState<any[]>(config.seed);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(
    () => Object.fromEntries(config.filters.map((f) => [f.key, "all"])),
  );
  const [sortCol, setSortCol] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [sortKey, setSortKey] = useState<string>(config.sortOptions?.[0]?.key ?? "new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<WallBulkAction | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useLocal<number>(lsKey(config.scope, "pageSize"), 25);
  const [density, setDensity] = useLocal<Density>(lsKey(config.scope, "density"), "comfortable");
  const [hiddenCols, setHiddenCols] = useLocal<string[]>(lsKey(config.scope, "hiddenCols"), []);
  const [colOrder, setColOrder] = useLocal<string[]>(lsKey(config.scope, "colOrder"), config.columns.map((c) => c.key));
  const [views, setViews] = useLocal<SavedView[]>(lsKey(config.scope, "views"), []);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [recent, setRecent] = useLocal<string[]>(lsKey(config.scope, "recent"), []);

  // First-paint loading skeleton (no fake latency beyond one frame batch).
  const sync = config.sync;

  const reload = useMemo(
    () => async () => {
      if (!sync) { setLoading(false); return; }
      setLoading(true);
      const data = await syncList(sync);
      if (data) setRows(data);
      setLoading(false);
    },
    [sync],
  );

  useEffect(() => {
    if (sync) { void reload(); return; }
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [sync, reload]);

  const visibleColumns = useMemo(() => {
    const order = colOrder.length ? colOrder : config.columns.map((c) => c.key);
    return [...config.columns]
      .filter((c) => !hiddenCols.includes(c.key))
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }, [config.columns, colOrder, hiddenCols]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => {
      for (const f of config.filters) {
        const val = filters[f.key];
        if (val && val !== "all" && String(x[f.key]) !== val) return false;
      }
      if (term) {
        const hay = config.searchFields.map((k) => String(x[k] ?? "")).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sortCol) {
      r = [...r].sort((a, b) => {
        const av = a[sortCol.key], bv = b[sortCol.key];
        const n = typeof av === "number" && typeof bv === "number"
          ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
        return sortCol.dir === "asc" ? n : -n;
      });
    } else {
      const sort = config.sortOptions?.find((s) => s.key === sortKey);
      if (sort) r = [...r].sort(sort.compare);
      else r = [...r].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    return r;
  }, [rows, q, filters, sortKey, sortCol, config]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const selected = rows.find((r) => r.id === openId) ?? null;

  const entries = useMemo(
    () => rows.map((r) => ({
      scope: config.scope,
      id: r.id,
      label: String(r[config.primaryField] ?? r.id),
      sub: config.subField ? String(r[config.subField] ?? "") : undefined,
      route: config.route,
      hay: config.searchFields.map((k) => String(r[k] ?? "")).join(" "),
    })),
    [rows, config],
  );
  useRegisterSearchScope(config.scope, entries);
  useEffect(() => { const p = consumePendingOpen(config.scope); if (p) setOpenId(p); }, [rows, config.scope]);

  // Deep link: /route?id=… opens the drawer, and the drawer keeps the URL in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpenId(id);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (openId) url.searchParams.set("id", openId); else url.searchParams.delete("id");
    window.history.replaceState({}, "", url.toString());
  }, [openId]);

  // Keyboard shortcuts: "/" focus search, "n" new record, "Esc" clear selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") { setSelectedIds(new Set()); return; }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById(`wall-search-${config.scope}`)?.focus(); }
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setCreateOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config.scope]);

  const allChecked = paged.length > 0 && paged.every((r) => selectedIds.has(r.id));
  const someChecked = paged.some((r) => selectedIds.has(r.id)) && !allChecked;
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const toggleAll = (checked: boolean) => setSelectedIds((prev) => {
    const next = new Set(prev);
    paged.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
    return next;
  });
  const clearSel = () => setSelectedIds(new Set());

  const activeChips = [
    ...config.filters
      .filter((f) => filters[f.key] && filters[f.key] !== "all")
      .map((f) => ({ key: f.key, label: `${f.label}: ${cap(filters[f.key])}` })),
    ...(q.trim() ? [{ key: "__q", label: `Search: "${q.trim()}"` }] : []),
  ];
  const resetFilters = () => { setQ(""); setFilters(Object.fromEntries(config.filters.map((f) => [f.key, "all"]))); setActiveView(null); };

  const applyRowPatch = (row: any, patch: Record<string, any>, action: string, summary: string) => {
    const updated = { ...row, ...patch, updated_at: new Date().toISOString() };
    setRows((p) => p.map((r) => (r.id === row.id ? updated : r)));
    if (sync) {
      void syncUpdate(sync, row.id, patch).then((saved) => {
        if (saved) setRows((p) => p.map((r) => (r.id === row.id ? saved : r)));
      });
    }
    void recordAction({
      action: `${config.entity}.${action}`, entityType: config.entity, entityId: row.id,
      summary, before: row, after: updated,
    });
    toast.success(summary, {
      action: {
        label: "Undo",
        onClick: () => {
          setRows((p) => p.map((r) => (r.id === row.id ? row : r)));
          if (sync) void syncUpdate(sync, row.id, row);
        },
      },
    });
  };

  const onRowAction = (row: any, actionKey: string) => {
    if (actionKey === "open") return setOpenId(row.id);
    if (actionKey === "edit") return setEditRow(row);
    if (actionKey === "delete") return setDeleteRow(row);
    if (actionKey === "duplicate") {
      const copy = { ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      copy[config.primaryField] = `${row[config.primaryField]} (copy)`;
      setRows((p) => [copy, ...p]);
      void recordAction({ action: `${config.entity}.duplicate`, entityType: config.entity, entityId: copy.id, summary: `Duplicated ${row[config.primaryField]}`, after: copy });
      toast.success(`${cap(config.entity)} duplicated`);
      return;
    }
    if (actionKey === "copy_link") {
      const url = `${window.location.origin}${config.route}?id=${row.id}`;
      void navigator.clipboard?.writeText(url);
      toast.success("Link copied to clipboard");
      return;
    }
    const def = config.rowActions?.find((a) => a.key === actionKey);
    if (def?.patch) applyRowPatch(row, def.patch, actionKey, `${cap(def.label)} · ${row[config.primaryField]}`);
  };

  const runBulk = (action: WallBulkAction) => {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0) return;
    const now = new Date().toISOString();
    if (action.key === "export") {
      setExportOpen(true); setBulkConfirm(null); return;
    }
    if (action.key === "delete") {
      const ids = new Set(targets.map((r) => r.id));
      const snapshot = rows;
      setRows((p) => p.filter((r) => !ids.has(r.id)));
      targets.forEach((r) => void recordAction({
        action: `${config.entity}.bulk_delete`, entityType: config.entity, entityId: r.id,
        summary: `Bulk deleted ${r[config.primaryField]}`, before: r,
      }));
      if (openId && ids.has(openId)) setOpenId(null);
      toast.success(`Deleted ${targets.length} ${config.entity}${targets.length === 1 ? "" : "s"}`, {
        action: { label: "Undo", onClick: () => setRows(snapshot) },
      });
    } else if (action.patch) {
      const snapshot = rows;
      setRows((p) => p.map((r) => (selectedIds.has(r.id) ? { ...r, ...action.patch, updated_at: now } : r)));
      targets.forEach((r) => void recordAction({
        action: `${config.entity}.bulk_${action.key}`, entityType: config.entity, entityId: r.id,
        summary: `Bulk ${action.label} · ${r[config.primaryField]}`,
        before: r, after: { ...r, ...action.patch },
      }));
      toast.success(`${action.label} · ${targets.length} ${config.entity}${targets.length === 1 ? "" : "s"}`, {
        action: { label: "Undo", onClick: () => setRows(snapshot) },
      });
    }
    clearSel();
    setBulkConfirm(null);
  };

  const Icon = config.icon;
  const rowPad = density === "compact" ? "py-1.5" : "py-3";
  const statusValues = useMemo(() => {
    const f = config.filters.find((x) => x.key === "status" || x.key === "state");
    return f ? [...f.options] : [];
  }, [config.filters]);

  const bulkActions = useMemo<WallBulkAction[]>(
    () => [...config.bulkActions, { key: "export", label: "Export", icon: Download }],
    [config.bulkActions],
  );


  return (
    <TooltipProvider delayDuration={200}>
      <WallHeader
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ToolBtn label="Refresh" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 300); toast.success("Refreshed"); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn label="Import from CSV" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import</span>
            </ToolBtn>
            <ToolBtn label="Export data" onClick={() => setExportOpen(true)}>
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
            </ToolBtn>
            <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>{config.primaryLabel}</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {config.kpis.map((k) => (
          <KPI key={k.label} label={k.label} value={k.compute(rows)} icon={k.icon} hint={k.hint} loading={loading} />
        ))}
      </div>

      <div className="mt-6">
        <SectionCard
          title={`${cap(config.entity)} Records`}
          description={`${filtered.length} of ${rows.length} · page ${page} of ${totalPages}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`wall-search-${config.scope}`}
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  onBlur={() => {
                    const t = q.trim();
                    if (t) setRecent((p) => [t, ...p.filter((x) => x !== t)].slice(0, 5));
                  }}
                  placeholder={`Search ${config.entity}…`}
                  className="h-8 w-[200px] pl-8 pr-14 text-[12px] lg:w-[240px]"
                />
                {q ? (
                  <button
                    onClick={() => setQ("")} aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
                  ><X className="h-3.5 w-3.5" /></button>
                ) : (
                  <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">/</kbd>
                )}
              </div>
              {config.filters.map((f) => (
                <Select key={f.key} value={filters[f.key] ?? "all"} onValueChange={(v) => { setFilters((p) => ({ ...p, [f.key]: v })); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px]">
                    <Filter className="mr-1 h-3 w-3" />
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {f.label}</SelectItem>
                    {f.options.map((o) => <SelectItem key={o} value={o}>{cap(o)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ))}
              {config.sortOptions && (
                <Select value={sortKey} onValueChange={(v) => { setSortKey(v); setSortCol(null); }}>
                  <SelectTrigger className="h-8 w-[140px] text-[12px]">
                    <ArrowDownUp className="mr-1 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.sortOptions.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <SavedViews
                views={views}
                activeId={activeView}
                onApply={(v) => { setQ(v.q); setFilters(v.filters); setSortKey(v.sortKey); setActiveView(v.id); setPage(1); }}
                onSave={(name) => {
                  const v: SavedView = { id: crypto.randomUUID(), name, q, filters, sortKey };
                  setViews((p) => [...p, v]); setActiveView(v.id);
                  toast.success(`View "${name}" saved`);
                }}
                onDelete={(id) => { setViews((p) => p.filter((x) => x.id !== id)); if (activeView === id) setActiveView(null); }}
              />
              <ColumnManager
                columns={config.columns}
                hidden={hiddenCols}
                order={colOrder.length ? colOrder : config.columns.map((c) => c.key)}
                onToggle={(k) => setHiddenCols((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))}
                onMove={(k, dir) => setColOrder((prev) => {
                  const arr = prev.length ? [...prev] : config.columns.map((c) => c.key);
                  const i = arr.indexOf(k); const j = i + dir;
                  if (i < 0 || j < 0 || j >= arr.length) return arr;
                  [arr[i], arr[j]] = [arr[j], arr[i]];
                  return arr;
                })}
                onReset={() => { setHiddenCols([]); setColOrder(config.columns.map((c) => c.key)); }}
              />
              <DensitySwitcher value={density} onChange={setDensity} />
            </div>
          }
        >
          <FilterChips
            chips={activeChips}
            onRemove={(k) => (k === "__q" ? setQ("") : setFilters((p) => ({ ...p, [k]: "all" })))}
            onClearAll={resetFilters}
          />

          {recent.length > 0 && !q && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-5 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</span>
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-accent">{r}</button>
              ))}
            </div>
          )}

          {loading ? (
            <TableSkeleton cols={Math.min(visibleColumns.length + 1, 6)} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Icon}
              title={rows.length === 0 ? `No ${config.entity}s yet` : "No matches"}
              description={rows.length === 0
                ? `Create your first ${config.entity} to get started, or import a CSV.`
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>{config.primaryLabel}</Btn>
                    <Btn variant="outline" leading={<Upload className="h-3.5 w-3.5" />} onClick={() => setImportOpen(true)}>Import CSV</Btn>
                  </div>
                )
                : <Btn variant="outline" onClick={resetFilters}>Clear filters</Btn>}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-10 pl-5">
                        <Checkbox
                          checked={allChecked ? true : someChecked ? "indeterminate" : false}
                          onCheckedChange={(v) => toggleAll(!!v)}
                          aria-label="Select all rows on this page"
                        />
                      </TableHead>
                      {visibleColumns.map((c) => {
                        const active = sortCol?.key === c.key;
                        return (
                          <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>
                            <button
                              onClick={() => setSortCol((p) => (p?.key === c.key
                                ? (p.dir === "asc" ? { key: c.key, dir: "desc" } : null)
                                : { key: c.key, dir: "asc" }))}
                              className={`inline-flex items-center gap-1 rounded transition-colors hover:text-foreground ${active ? "text-foreground" : ""}`}
                              aria-label={`Sort by ${c.header}`}
                            >
                              {c.header}
                              {active
                                ? (sortCol!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                                : <ArrowDownUp className="h-3 w-3 opacity-30" />}
                            </button>
                          </TableHead>
                        );
                      })}
                      <TableHead className="w-14 pr-5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((r) => (
                      <TableRow
                        key={r.id}
                        data-state={selectedIds.has(r.id) ? "selected" : undefined}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setOpenId(r.id); }}
                        className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-primary-soft/50"
                        onClick={() => setOpenId(r.id)}
                      >
                        <TableCell className={`pl-5 ${rowPad}`} onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleOne(r.id)} aria-label={`Select ${r[config.primaryField]}`} />
                        </TableCell>
                        {visibleColumns.map((c) => (
                          <TableCell key={c.key} className={`${rowPad} ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}>
                            {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                          </TableCell>
                        ))}
                        <TableCell className={`pr-5 text-right ${rowPad}`} onClick={(e) => e.stopPropagation()}>
                          <RowMenu config={config} row={r} onAction={(k) => onRowAction(r, k)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <ul className="divide-y divide-border md:hidden">
                {paged.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                    <Checkbox
                      className="mt-1" checked={selectedIds.has(r.id)}
                      onCheckedChange={() => toggleOne(r.id)}
                      aria-label={`Select ${r[config.primaryField]}`}
                    />
                    <button onClick={() => setOpenId(r.id)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold">{String(r[config.primaryField] ?? r.id)}</span>
                        {r.status && <StatusPill value={String(r.status)} colorMap={config.statusColorMap} />}
                      </div>
                      {config.subField && <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{String(r[config.subField] ?? "")}</div>}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {visibleColumns.slice(0, 3).map((c) => (
                          <span key={c.key} className="truncate">{c.header}: <span className="text-foreground">{String(r[c.key] ?? "—")}</span></span>
                        ))}
                      </div>
                    </button>
                    <RowMenu config={config} row={r} onAction={(k) => onRowAction(r, k)} />
                  </li>
                ))}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
              <StatusLegend values={statusValues} />
              <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
                <CommandIcon className="h-3 w-3" />
                <span><kbd className="rounded border border-border bg-muted px-1">/</kbd> search</span>
                <span><kbd className="rounded border border-border bg-muted px-1">N</kbd> new</span>
                <span><kbd className="rounded border border-border bg-muted px-1">Esc</kbd> clear selection</span>
                <span><kbd className="rounded border border-border bg-muted px-1">Enter</kbd> open row</span>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <BulkBar
        count={selectedIds.size}
        entity={config.entity}
        onClear={clearSel}
        onAction={(k) => {
          const a = bulkActions.find((x) => x.key === k);
          if (!a) return;
          if (a.confirmTitle || a.variant === "destructive") setBulkConfirm(a);
          else runBulk(a);
        }}
        actions={bulkActions}
      />

      <AlertDialog open={!!bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirm?.confirmTitle ?? `${bulkConfirm?.label} ${selectedIds.size} ${config.entity}${selectedIds.size === 1 ? "" : "s"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm?.confirmDescription ?? "This action is logged to the audit trail and can be undone from the toast."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkConfirm && runBulk(bulkConfirm)}
              className={bulkConfirm?.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {bulkConfirm?.label} {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.entity}?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove <span className="font-semibold">{deleteRow?.[config.primaryField]}</span>. This is logged to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteRow) return;
                const snapshot = rows;
                setRows((p) => p.filter((r) => r.id !== deleteRow.id));
                void recordAction({
                  action: `${config.entity}.delete`, entityType: config.entity, entityId: deleteRow.id,
                  summary: `Deleted ${deleteRow[config.primaryField]}`, before: deleteRow,
                });
                if (openId === deleteRow.id) setOpenId(null);
                setDeleteRow(null);
                toast.success(`${cap(config.entity)} deleted`, { action: { label: "Undo", onClick: () => setRows(snapshot) } });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DetailDrawer
        row={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setOpenId(null)}
        config={config}
        onRowAction={(a) => selected && onRowAction(selected, a)}
      />

      <RecordSheet
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
        onSubmit={(data) => {
          const now = new Date().toISOString();
          const row: Record<string, any> = { ...data, id: crypto.randomUUID(), created_at: now, updated_at: now };
          setRows((p) => [row, ...p]);
          void recordAction({
            action: `${config.entity}.create`, entityType: config.entity, entityId: row.id,
            summary: `Created ${config.entity} "${row[config.primaryField]}"`, after: row,
          });
          toast.success(`${cap(config.entity)} created`);
          setCreateOpen(false);
        }}
      />

      <RecordSheet
        mode="edit"
        initial={editRow ?? undefined}
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        config={config}
        onSubmit={(data) => {
          if (!editRow) return;
          applyRowPatch(editRow, data, "update", `Updated ${data[config.primaryField] ?? editRow[config.primaryField]}`);
          setEditRow(null);
        }}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        name={config.scope}
        columns={config.columns.map((c) => ({ key: c.key, header: c.header }))}
        allRows={rows}
        filteredRows={filtered}
        selectedRows={rows.filter((r) => selectedIds.has(r.id))}
        onExported={(fmt, count) => void recordAction({
          action: `${config.entity}.export`, entityType: config.entity,
          summary: `Exported ${count} ${config.entity}s as ${fmt.toUpperCase()}`,
        })}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity={config.entity}
        fields={config.formFields.map((f) => ({ key: f.key, label: f.label, required: f.required }))}
        onImport={(imported) => {
          const now = new Date().toISOString();
          const created = imported.map((d) => ({ ...d, id: crypto.randomUUID(), created_at: now, updated_at: now }));
          setRows((p) => [...created, ...p]);
          void recordAction({
            action: `${config.entity}.import`, entityType: config.entity,
            summary: `Imported ${created.length} ${config.entity}s from CSV`,
          });
          toast.success(`Imported ${created.length} ${config.entity}${created.length === 1 ? "" : "s"}`);
        }}
      />
    </TooltipProvider>
  );
}

/* ---------------- Row menu ---------------- */

function RowMenu({ config, row, onAction }: { config: WallConfig; row: any; onAction: (k: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Actions for ${row[config.primaryField]}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onAction("open")}><Eye className="mr-2 h-3.5 w-3.5" /> View details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("edit")}><ChevronRight className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("duplicate")}><Plus className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("copy_link")}><Link2 className="mr-2 h-3.5 w-3.5" /> Copy link</DropdownMenuItem>
        {config.rowActions && config.rowActions.length > 0 && <DropdownMenuSeparator />}
        {config.rowActions?.map((a) => {
          const RIcon = a.icon;
          return (
            <DropdownMenuItem key={a.key} onSelect={() => onAction(a.key)} className={a.destructive ? "text-destructive" : ""}>
              {RIcon && <RIcon className="mr-2 h-3.5 w-3.5" />}{a.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction("delete")} className="text-destructive">
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- Detail Drawer ---------------- */

function DetailDrawer({
  row, open, onOpenChange, config, onRowAction,
}: {
  row: any | null; open: boolean; onOpenChange: (o: boolean) => void;
  config: WallConfig; onRowAction: (k: string) => void;
}) {
  const [notes, setNotes] = useState<{ id: string; text: string; at: string }[]>([]);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { setNotes([]); setNote(""); setTags([]); }, [row?.id]);

  if (!row) return null;
  const Icon = config.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-[560px]">
        <SheetHeader>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{row[config.primaryField]}</SheetTitle>
              {config.subField && <SheetDescription className="truncate">{row[config.subField]}</SheetDescription>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => onRowAction("copy_link")}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[11px] font-semibold hover:bg-accent"
            ><Link2 className="h-3 w-3" /> Copy link</button>
            <button
              onClick={() => onRowAction("edit")}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[11px] font-semibold hover:bg-accent"
            >Edit</button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-5">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-surface/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                {config.columns.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[11px] text-muted-foreground">{c.header}</dt>
                    <dd className="mt-0.5 truncate font-medium">{c.render ? c.render(row) : String(row[c.key] ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <TagIcon className="h-3 w-3" /> Tags
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium">
                    {t}
                    <button onClick={() => setTags((p) => p.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      setTags((p) => Array.from(new Set([...p, tagInput.trim()])));
                      setTagInput("");
                    }
                  }}
                  placeholder="Add tag…"
                  aria-label="Add tag"
                  className="h-7 w-[110px] rounded-md border border-dashed border-border bg-transparent px-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {config.renderDetail && (
              <div className="rounded-lg border border-border bg-surface/40 p-4">{config.renderDetail(row)}</div>
            )}

            {config.rowActions && config.rowActions.length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</div>
                <div className="flex flex-wrap gap-2">
                  {config.rowActions.map((a) => {
                    const RIcon = a.icon;
                    return (
                      <button
                        key={a.key}
                        onClick={() => onRowAction(a.key)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors ${
                          a.destructive
                            ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                            : "border-border bg-surface hover:bg-accent"
                        }`}
                      >
                        {RIcon && <RIcon className="h-3.5 w-3.5" />}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {[
                { label: "Record created", at: row.created_at },
                ...(row.updated_at && row.updated_at !== row.created_at ? [{ label: "Record updated", at: row.updated_at }] : []),
              ].map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[25px] top-1 grid h-3 w-3 place-items-center rounded-full border-2 border-background bg-primary" aria-hidden />
                  <div className="text-[13px] font-semibold">{e.label}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {String(e.at ?? "—")}
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="notes" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add an internal note…" />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!note.trim()) { toast.error("Note cannot be empty"); return; }
                    setNotes((p) => [{ id: crypto.randomUUID(), text: note.trim(), at: new Date().toLocaleString() }, ...p]);
                    setNote("");
                    toast.success("Note added");
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90"
                ><MessageSquare className="h-3.5 w-3.5" /> Add note</button>
              </div>
            </div>
            {notes.length === 0 ? (
              <EmptyState compact icon={MessageSquare} title="No notes yet" description="Internal notes stay with this record." />
            ) : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border bg-surface/40 p-3">
                    <p className="text-[13px]">{n.text}</p>
                    <div className="mt-1 text-[11px] text-muted-foreground">{n.at}</div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-muted/50">
                  <tr><th className="px-3 py-2 text-left font-semibold">Field</th><th className="px-3 py-2 text-left font-semibold">Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(row).map(([k, v]) => (
                    <tr key={k} className="border-t border-border">
                      <td className="px-3 py-1.5 text-muted-foreground">{k}</td>
                      <td className="max-w-[280px] truncate px-3 py-1.5 font-medium">{String(v ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <button
            onClick={() => onRowAction("delete")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-[12px] font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Create / Edit Sheet ---------------- */

function RecordSheet({
  mode, open, onOpenChange, config, onSubmit, initial,
}: {
  mode: "create" | "edit";
  open: boolean; onOpenChange: (o: boolean) => void; config: WallConfig;
  onSubmit: (data: Record<string, any>) => void;
  initial?: Record<string, any>;
}) {
  const blank = () => Object.fromEntries(config.formFields.map((f) => [f.key, f.defaultValue ?? (f.type === "number" ? 0 : "")]));
  const [form, setForm] = useState<Record<string, any>>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? Object.fromEntries(config.formFields.map((f) => [f.key, initial[f.key] ?? f.defaultValue ?? (f.type === "number" ? 0 : "")]))
        : blank());
      setErrors({}); setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, config.formFields]);

  const set = (k: string, v: any) => { setForm((p) => ({ ...p, [k]: v })); setDirty(true); setErrors((p) => ({ ...p, [k]: "" })); };

  const submit = () => {
    const next: Record<string, string> = {};
    for (const f of config.formFields) {
      const val = String(form[f.key] ?? "").trim();
      if (f.required && !val) next[f.key] = `${f.label} is required`;
      else if (f.type === "email" && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) next[f.key] = "Enter a valid email address";
      else if (f.type === "number" && val && Number.isNaN(Number(val))) next[f.key] = "Enter a valid number";
    }
    setErrors(next);
    if (Object.keys(next).length) { toast.error("Please fix the highlighted fields"); return; }
    onSubmit(form);
  };

  const requestClose = (o: boolean) => {
    if (!o && dirty) { setConfirmClose(true); return; }
    onOpenChange(o);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-[480px]">
          <SheetHeader>
            <SheetTitle>{mode === "create" ? config.primaryLabel : `Edit ${config.entity}`}</SheetTitle>
            <SheetDescription>
              {mode === "create" ? `Create a new ${config.entity}.` : "Update the fields below. Changes are logged."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-4">
            {config.formFields.map((f) => {
              const err = errors[f.key];
              return (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`fld-${config.scope}-${f.key}`} className="text-[12px]">
                    {f.label}{f.required && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`fld-${config.scope}-${f.key}`}
                      value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder} rows={3}
                      aria-invalid={!!err}
                      className={err ? "border-destructive" : ""}
                    />
                  ) : f.type === "select" ? (
                    <Select value={String(form[f.key] ?? "")} onValueChange={(v) => set(f.key, v)}>
                      <SelectTrigger id={`fld-${config.scope}-${f.key}`} className={`h-9 ${err ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={f.placeholder ?? "Select…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{cap(o)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`fld-${config.scope}-${f.key}`}
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                      value={form[f.key] ?? ""}
                      onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      placeholder={f.placeholder}
                      aria-invalid={!!err}
                      className={err ? "border-destructive" : ""}
                    />
                  )}
                  {err ? <p className="text-[11px] font-medium text-destructive">{err}</p>
                    : f.help ? <p className="text-[11px] text-muted-foreground">{f.help}</p> : null}
                </div>
              );
            })}
          </div>
          <SheetFooter className="mt-6">
            <button
              onClick={() => requestClose(false)}
              className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-semibold hover:bg-accent"
            >Cancel</button>
            <button
              onClick={submit}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >{mode === "create" ? "Create" : "Save changes"}</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>Your edits to this {config.entity} have not been saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmClose(false); setDirty(false); onOpenChange(false); }}
            >Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
