import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Filter, MoreHorizontal, ArrowDownUp, Trash2, Eye,
} from "lucide-react";
import { WallHeader } from "@/components/wall/Shell";
import { Btn, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { BulkBar } from "@/components/wall/BulkBar";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useRegisterSearchScope, consumePendingOpen } from "@/lib/searchIndex";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WallField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "select";
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
};

export type WallColumn = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
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

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  processing: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  open: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  paused: "bg-muted text-muted-foreground border-border",
  expired: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  refunded: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  critical: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

export function StatusPill({ value, colorMap }: { value: string; colorMap?: Record<string, string> }) {
  const cls = (colorMap && colorMap[value]) ?? DEFAULT_STATUS_COLORS[value] ?? "bg-muted text-muted-foreground border-border";
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{value}</Badge>;
}

export function GenericWall({ config }: { config: WallConfig }) {
  const [rows, setRows] = useState<any[]>(config.seed);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(
    () => Object.fromEntries(config.filters.map((f) => [f.key, "all"])),
  );
  const [sortKey, setSortKey] = useState<string>(config.sortOptions?.[0]?.key ?? "new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<WallBulkAction | null>(null);

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
    const sort = config.sortOptions?.find((s) => s.key === sortKey);
    if (sort) r = [...r].sort(sort.compare);
    else r = [...r].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return r;
  }, [rows, q, filters, sortKey, config]);

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

  const allChecked = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? new Set(filtered.map((r) => r.id)) : new Set());
  const clearSel = () => setSelectedIds(new Set());

  const applyRowPatch = (row: any, patch: Record<string, any>, action: string, summary: string) => {
    const updated = { ...row, ...patch, updated_at: new Date().toISOString() };
    setRows((p) => p.map((r) => (r.id === row.id ? updated : r)));
    void recordAction({
      action: `${config.entity}.${action}`, entityType: config.entity, entityId: row.id,
      summary, before: row, after: updated,
    });
    toast.success(summary);
  };

  const onRowAction = (row: any, actionKey: string) => {
    if (actionKey === "open") return setOpenId(row.id);
    if (actionKey === "delete") return setDeleteRow(row);
    const def = config.rowActions?.find((a) => a.key === actionKey);
    if (def?.patch) {
      applyRowPatch(row, def.patch, actionKey, `${cap(def.label)} · ${row[config.primaryField]}`);
    }
  };

  const runBulk = (action: WallBulkAction) => {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0) return;
    const now = new Date().toISOString();
    if (action.key === "delete") {
      const ids = new Set(targets.map((r) => r.id));
      setRows((p) => p.filter((r) => !ids.has(r.id)));
      targets.forEach((r) => void recordAction({
        action: `${config.entity}.bulk_delete`, entityType: config.entity, entityId: r.id,
        summary: `Bulk deleted ${r[config.primaryField]}`, before: r,
      }));
      if (openId && ids.has(openId)) setOpenId(null);
      toast.success(`Deleted ${targets.length} ${config.entity}${targets.length === 1 ? "" : "s"}`);
    } else if (action.patch) {
      setRows((p) => p.map((r) => (selectedIds.has(r.id) ? { ...r, ...action.patch, updated_at: now } : r)));
      targets.forEach((r) => void recordAction({
        action: `${config.entity}.bulk_${action.key}`, entityType: config.entity, entityId: r.id,
        summary: `Bulk ${action.label} · ${r[config.primaryField]}`,
        before: r, after: { ...r, ...action.patch },
      }));
      toast.success(`${action.label} · ${targets.length} ${config.entity}${targets.length === 1 ? "" : "s"}`);
    }
    clearSel();
    setBulkConfirm(null);
  };

  const Icon = config.icon;

  return (
    <>
      <WallHeader
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={config.subtitle}
        actions={<Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>{config.primaryLabel}</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {config.kpis.map((k) => (
          <KPI key={k.label} label={k.label} value={k.compute(rows)} icon={k.icon} hint={k.hint} />
        ))}
      </div>

      <div className="mt-6">
        <SectionCard
          title={`${cap(config.entity)} Records`}
          description={`${filtered.length} of ${rows.length}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${config.entity}…`}
                  className="h-8 w-[240px] pl-8 text-[12px]"
                />
              </div>
              {config.filters.map((f) => (
                <Select key={f.key} value={filters[f.key] ?? "all"} onValueChange={(v) => setFilters((p) => ({ ...p, [f.key]: v }))}>
                  <SelectTrigger className="h-8 w-[150px] text-[12px]">
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
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger className="h-8 w-[150px] text-[12px]">
                    <ArrowDownUp className="mr-1 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.sortOptions.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={Icon}
              title={rows.length === 0 ? `No ${config.entity}s yet` : "No matches"}
              description={rows.length === 0
                ? `Create your first ${config.entity} to get started.`
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>{config.primaryLabel}</Btn>
                : <Btn variant="outline" onClick={() => { setQ(""); setFilters(Object.fromEntries(config.filters.map((f) => [f.key, "all"]))); }}>Clear filters</Btn>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-5">
                    <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} aria-label="Select all" />
                  </TableHead>
                  {config.columns.map((c) => (
                    <TableHead key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.header}</TableHead>
                  ))}
                  <TableHead className="w-14 text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    data-state={selectedIds.has(r.id) ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setOpenId(r.id)}
                  >
                    <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleOne(r.id)} aria-label="Select row" />
                    </TableCell>
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className={`${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}>
                        {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => onRowAction(r, "open")}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                          {config.rowActions?.map((a) => {
                            const RIcon = a.icon;
                            return (
                              <DropdownMenuItem
                                key={a.key}
                                onSelect={() => onRowAction(r, a.key)}
                                className={a.destructive ? "text-destructive" : ""}
                              >
                                {RIcon && <RIcon className="mr-2 h-3.5 w-3.5" />}
                                {a.label}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => onRowAction(r, "delete")} className="text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <BulkBar
        count={selectedIds.size}
        entity={config.entity}
        onClear={clearSel}
        onAction={(k) => {
          const a = config.bulkActions.find((x) => x.key === k);
          if (!a) return;
          if (a.confirmTitle || a.variant === "destructive") setBulkConfirm(a);
          else runBulk(a);
        }}
        actions={config.bulkActions}
      />

      <AlertDialog open={!!bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirm?.confirmTitle ?? `${bulkConfirm?.label} ${selectedIds.size} ${config.entity}${selectedIds.size === 1 ? "" : "s"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm?.confirmDescription ?? "This action is logged to the audit trail."}
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
                setRows((p) => p.filter((r) => r.id !== deleteRow.id));
                void recordAction({
                  action: `${config.entity}.delete`, entityType: config.entity, entityId: deleteRow.id,
                  summary: `Deleted ${deleteRow[config.primaryField]}`, before: deleteRow,
                });
                if (openId === deleteRow.id) setOpenId(null);
                setDeleteRow(null);
                toast.success(`${cap(config.entity)} deleted`);
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

      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
        onCreate={(data) => {
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
    </>
  );
}

/* ---------------- Detail Drawer ---------------- */

function DetailDrawer({
  row, open, onOpenChange, config, onRowAction,
}: {
  row: any | null; open: boolean; onOpenChange: (o: boolean) => void;
  config: WallConfig; onRowAction: (k: string) => void;
}) {
  if (!row) return null;
  const Icon = config.icon;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[520px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{row[config.primaryField]}</SheetTitle>
              {config.subField && <SheetDescription className="truncate">{row[config.subField]}</SheetDescription>}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border bg-surface/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overview</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
              {config.columns.slice(0, 8).map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[11px] text-muted-foreground">{c.header}</dt>
                  <dd className="mt-0.5 truncate font-medium">
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {config.renderDetail && (
            <div className="rounded-lg border border-border bg-surface/40 p-4">
              {config.renderDetail(row)}
            </div>
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
        </div>

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

/* ---------------- Create Sheet ---------------- */

function CreateSheet({
  open, onOpenChange, config, onCreate,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; config: WallConfig;
  onCreate: (data: Record<string, any>) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(() =>
    Object.fromEntries(config.formFields.map((f) => [f.key, f.defaultValue ?? (f.type === "number" ? 0 : "")])),
  );

  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(config.formFields.map((f) => [f.key, f.defaultValue ?? (f.type === "number" ? 0 : "")])));
    }
  }, [open, config.formFields]);

  const submit = () => {
    for (const f of config.formFields) {
      if (f.required && !String(form[f.key] ?? "").trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    onCreate(form);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[460px]">
        <SheetHeader>
          <SheetTitle>{config.primaryLabel}</SheetTitle>
          <SheetDescription>Create a new {config.entity}.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          {config.formFields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-[12px]">{f.label}{f.required && <span className="ml-0.5 text-destructive">*</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : f.type === "select" ? (
                <Select value={String(form[f.key] ?? "")} onValueChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={f.placeholder ?? "Select…"} /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{cap(o)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <SheetFooter className="mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-semibold hover:bg-accent"
          >Cancel</button>
          <button
            onClick={submit}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
          >Create</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
