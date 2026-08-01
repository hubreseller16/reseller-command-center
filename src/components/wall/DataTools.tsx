import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download, Upload, Columns3, Rows3, X, Check, Star, Save, RotateCcw, FileSpreadsheet,
  FileText, ChevronLeft, ChevronRight, AlertTriangle, GripVertical,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { exportCSV, exportExcel, parseCSV, type ExportColumn } from "@/lib/exportData";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Density = "comfortable" | "compact";

/* ---------------- Toolbar button ---------------- */

export function ToolBtn({
  children, label, onClick, active, badge,
}: { children: React.ReactNode; label: string; onClick?: () => void; active?: boolean; badge?: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button" aria-label={label} onClick={onClick}
          className={`relative inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
            active ? "border-primary/50 bg-primary-soft text-primary" : "border-border bg-surface hover:bg-accent"
          }`}
        >
          {children}
          {typeof badge === "number" && badge > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{badge}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/* ---------------- Density switcher ---------------- */

export function DensitySwitcher({ value, onChange }: { value: Density; onChange: (d: Density) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Row density"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Rows3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Density</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Row density</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Density)}>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- Column manager ---------------- */

export function ColumnManager({
  columns, hidden, order, onToggle, onMove, onReset,
}: {
  columns: { key: string; header: string }[];
  hidden: string[];
  order: string[];
  onToggle: (key: string) => void;
  onMove: (key: string, dir: -1 | 1) => void;
  onReset: () => void;
}) {
  const ordered = useMemo(
    () => [...columns].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)),
    [columns, order],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Manage columns"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Columns3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Columns</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          Visible columns
          <button onClick={onReset} className="text-[11px] font-medium text-primary hover:underline">Reset</button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[320px] overflow-y-auto">
          {ordered.map((c, i) => (
            <div key={c.key} className="flex items-center gap-1 px-1.5 py-1">
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 text-[12px] hover:bg-accent">
                <Checkbox checked={!hidden.includes(c.key)} onCheckedChange={() => onToggle(c.key)} aria-label={`Toggle ${c.header}`} />
                <span className="truncate">{c.header}</span>
              </label>
              <button
                aria-label={`Move ${c.header} up`} disabled={i === 0} onClick={() => onMove(c.key, -1)}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
              ><ChevronLeft className="h-3 w-3 rotate-90" /></button>
              <button
                aria-label={`Move ${c.header} down`} disabled={i === ordered.length - 1} onClick={() => onMove(c.key, 1)}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-accent disabled:opacity-30"
              ><ChevronRight className="h-3 w-3 rotate-90" /></button>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- Active filter chips ---------------- */

export function FilterChips({
  chips, onRemove, onClearAll,
}: { chips: { key: string; label: string }[]; onRemove: (key: string) => void; onClearAll: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-5 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active</span>
      {chips.map((c) => (
        <span key={c.key} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium">
          {c.label}
          <button onClick={() => onRemove(c.key)} aria-label={`Remove ${c.label} filter`} className="rounded-full text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button onClick={onClearAll} className="ml-1 text-[11px] font-semibold text-primary hover:underline">Clear all</button>
    </div>
  );
}

/* ---------------- Saved views ---------------- */

export type SavedView = { id: string; name: string; q: string; filters: Record<string, string>; sortKey: string };

export function SavedViews({
  views, activeId, onApply, onSave, onDelete,
}: {
  views: SavedView[]; activeId: string | null;
  onApply: (v: SavedView) => void; onSave: (name: string) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Saved views"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={`h-3.5 w-3.5 ${activeId ? "fill-primary text-primary" : ""}`} />
            <span className="hidden sm:inline">Views</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px]">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 && <div className="px-2 py-3 text-[12px] text-muted-foreground">No saved views yet.</div>}
          {views.map((v) => (
            <div key={v.id} className="flex items-center gap-1 px-1">
              <button onClick={() => onApply(v)} className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left text-[12px] hover:bg-accent">
                {activeId === v.id ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : <span className="w-3.5" />}
                <span className="truncate">{v.name}</span>
              </button>
              <button onClick={() => onDelete(v.id)} aria-label={`Delete view ${v.name}`} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { setName(""); setOpen(true); }}>
            <Save className="mr-2 h-3.5 w-3.5" /> Save current view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>Stores your search, filters and sort order for one-click recall.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-[12px]">View name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pending high value" autoFocus />
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-semibold hover:bg-accent">Cancel</button>
            <button
              onClick={() => {
                if (!name.trim()) { toast.error("View name is required"); return; }
                onSave(name.trim()); setOpen(false);
              }}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >Save view</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Export ---------------- */

export function ExportDialog({
  open, onOpenChange, name, columns, allRows, filteredRows, selectedRows, onExported,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; name: string;
  columns: ExportColumn[]; allRows: any[]; filteredRows: any[]; selectedRows: any[];
  onExported?: (format: string, count: number) => void;
}) {
  const [scope, setScope] = useState<"filtered" | "all" | "selected">("filtered");
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [cols, setCols] = useState<string[]>(columns.map((c) => c.key));

  const rows = scope === "all" ? allRows : scope === "selected" ? selectedRows : filteredRows;
  const picked = columns.filter((c) => cols.includes(c.key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Export {name}</DialogTitle>
          <DialogDescription>Choose scope, format and the columns to include.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Rows</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="filtered">Current view ({filteredRows.length})</SelectItem>
                <SelectItem value="all">All records ({allRows.length})</SelectItem>
                <SelectItem value="selected" disabled={selectedRows.length === 0}>Selected only ({selectedRows.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {([["csv", "CSV", FileText], ["excel", "Excel", FileSpreadsheet]] as const).map(([k, lbl, I]) => (
                <button
                  key={k} onClick={() => setFormat(k)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    format === k ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-accent"
                  }`}
                >
                  <I className="h-4 w-4" /> {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Columns ({picked.length}/{columns.length})</Label>
            <div className="grid max-h-[160px] grid-cols-2 gap-1 overflow-y-auto rounded-lg border border-border p-2">
              {columns.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px] hover:bg-accent">
                  <Checkbox
                    checked={cols.includes(c.key)}
                    onCheckedChange={() => setCols((p) => (p.includes(c.key) ? p.filter((x) => x !== c.key) : [...p, c.key]))}
                    aria-label={`Include ${c.header}`}
                  />
                  <span className="truncate">{c.header}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-semibold hover:bg-accent">Cancel</button>
          <button
            onClick={() => {
              if (rows.length === 0) { toast.error("Nothing to export"); return; }
              if (picked.length === 0) { toast.error("Select at least one column"); return; }
              if (format === "csv") exportCSV(name, rows, picked); else exportExcel(name, rows, picked);
              toast.success(`Exported ${rows.length} rows as ${format.toUpperCase()}`);
              onExported?.(format, rows.length);
              onOpenChange(false);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
          ><Download className="h-3.5 w-3.5" /> Export {rows.length}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Import ---------------- */

export function ImportDialog({
  open, onOpenChange, entity, fields, onImport,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; entity: string;
  fields: { key: string; label: string; required?: boolean }[];
  onImport: (rows: Record<string, any>[]) => void;
}) {
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [map, setMap] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setParsed(null); setMap({}); setFileName(""); };

  const readFile = async (file: File) => {
    const text = await file.text();
    const p = parseCSV(text);
    setFileName(file.name);
    setParsed(p);
    const auto: Record<string, string> = {};
    fields.forEach((f) => {
      const hit = p.headers.find((h) => h.toLowerCase().replace(/[\s_]/g, "") === f.key.toLowerCase().replace(/[\s_]/g, "")
        || h.toLowerCase() === f.label.toLowerCase());
      if (hit) auto[f.key] = hit;
    });
    setMap(auto);
  };

  const mapped = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((r) => {
      const obj: Record<string, any> = {};
      fields.forEach((f) => {
        const h = map[f.key];
        if (h) obj[f.key] = r[parsed.headers.indexOf(h)] ?? "";
      });
      return obj;
    });
  }, [parsed, map, fields]);

  const invalid = mapped.filter((r) => fields.some((f) => f.required && !String(r[f.key] ?? "").trim())).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Import {entity}s</DialogTitle>
          <DialogDescription>Upload a CSV, map the columns, review the preview, then import.</DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <div className="space-y-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-border px-4 py-10 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <Upload className="h-6 w-6 text-primary" />
              <span className="mt-3 text-[13px] font-semibold">Choose a CSV file</span>
              <span className="mt-1 text-[12px] text-muted-foreground">First row must contain column headers</span>
            </button>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ""; }} />
            <button
              onClick={() => {
                const headers = fields.map((f) => f.label).join(",");
                const blob = new Blob([headers + "\n"], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob); a.download = `${entity}-template.csv`; a.click();
              }}
              className="text-[12px] font-semibold text-primary hover:underline"
            >Download CSV template</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3 py-2 text-[12px]">
              <span className="truncate font-semibold">{fileName}</span>
              <button onClick={reset} className="text-primary hover:underline">Choose another</button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Column mapping</Label>
              <div className="grid max-h-[180px] gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="w-1/2 truncate text-[12px]">{f.label}{f.required && <span className="text-destructive">*</span>}</span>
                    <Select value={map[f.key] ?? "__none"} onValueChange={(v) => setMap((p) => ({ ...p, [f.key]: v === "__none" ? "" : v }))}>
                      <SelectTrigger className="h-8 flex-1 text-[12px]"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">— Skip —</SelectItem>
                        {parsed.headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {invalid > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {invalid} of {mapped.length} rows are missing required values and will be skipped.
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[12px]">Preview (first 5 of {mapped.length})</Label>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/50">
                    <tr>{fields.map((f) => <th key={f.key} className="px-2 py-1.5 text-left font-semibold">{f.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {mapped.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        {fields.map((f) => <td key={f.key} className="max-w-[140px] truncate px-2 py-1.5">{String(r[f.key] ?? "—")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <button onClick={() => { onOpenChange(false); reset(); }} className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-semibold hover:bg-accent">Cancel</button>
          <button
            disabled={!parsed}
            onClick={() => {
              const valid = mapped.filter((r) => fields.every((f) => !f.required || String(r[f.key] ?? "").trim()));
              if (valid.length === 0) { toast.error("No valid rows to import"); return; }
              onImport(valid);
              onOpenChange(false); reset();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          ><Upload className="h-3.5 w-3.5" /> Import</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Pagination ---------------- */

export function Pagination({
  page, pageSize, total, onPage, onPageSize,
}: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (s: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
      <div className="text-[12px] text-muted-foreground">Showing <span className="font-semibold text-foreground">{from}–{to}</span> of {total}</div>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(v) => { onPageSize(Number(v)); onPage(1); }}>
          <SelectTrigger className="h-8 w-[110px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-accent disabled:opacity-40"
          ><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="px-2 text-[12px] font-semibold">{page} / {pages}</span>
          <button
            aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}
            className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-accent disabled:opacity-40"
          ><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Skeleton ---------------- */

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3.5 animate-pulse rounded bg-muted" style={{ width: c === 0 ? "22%" : `${12 + ((c * 7) % 14)}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export { RotateCcw };
