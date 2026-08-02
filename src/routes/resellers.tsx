import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Search, Filter, RefreshCcw, MoreHorizontal, ShieldCheck,
  ShieldAlert, Pause, Play, CheckCircle2, XCircle, Mail, Phone, MapPin,
  Wallet, Percent, KeyRound, ShoppingCart, Activity, ScrollText, Bell, ChevronsUpDown,
  ArrowDownUp, BadgeCheck, Download, Upload, Trash2, BadgeCheck as VerifyIcon,
} from "lucide-react";

import { WallHeader } from "@/components/wall/Shell";
import { Btn, Card, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { BulkBar } from "@/components/wall/BulkBar";
import {
  DensitySwitcher, ExportDialog, FilterChips, ImportDialog, Pagination, ToolBtn, type Density,
} from "@/components/wall/DataTools";
import { Checkbox } from "@/components/ui/checkbox";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { recordAction } from "@/lib/recordAction";

export const Route = createFileRoute("/resellers")({
  head: () => ({
    meta: [
      { title: "Resellers — Reseller Manager" },
      { name: "description", content: "Directory of every reseller — search, filter, onboard and act." },
    ],
  }),
  component: ResellersWall,
});

// ───────── types ─────────
type Reseller = Tables<"resellers">;
type ActivityEvent = Tables<"activity_events">;
type AuditLog = Tables<"audit_logs">;
type Notification = Tables<"notifications">;

const TIERS = ["bronze", "silver", "gold", "platinum"] as const;
const STATUSES = ["pending", "active", "suspended", "rejected"] as const;
const KYC = ["unverified", "submitted", "verified", "rejected"] as const;

// ───────── queries ─────────
async function fetchResellers(): Promise<Reseller[]> {
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ───────── wall ─────────
function ResellersWall() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["resellers"],
    queryFn: fetchResellers,
    staleTime: 15_000,
  });

  // toolbar state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [kyc, setKyc] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "name" | "tier">("new");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => {
      if (status !== "all" && x.status !== status) return false;
      if (tier !== "all" && x.tier !== tier) return false;
      if (kyc !== "all" && x.kyc_status !== kyc) return false;
      if (term) {
        const hay = `${x.business_name} ${x.code} ${x.email} ${x.contact_name ?? ""} ${x.region ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sort === "name") r = [...r].sort((a, b) => a.business_name.localeCompare(b.business_name));
    if (sort === "tier") r = [...r].sort((a, b) => TIERS.indexOf(b.tier as typeof TIERS[number]) - TIERS.indexOf(a.tier as typeof TIERS[number]));
    return r;
  }, [rows, q, status, tier, kyc, sort]);

  // density + paging
  const [density, setDensity] = useState<Density>("comfortable");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );
  useEffect(() => { setPage(1); }, [q, status, tier, kyc, sort, pageSize]);

  // selection
  const [sel, setSel] = useState<string[]>([]);
  const selectedRows = useMemo(() => filtered.filter((r) => sel.includes(r.id)), [filtered, sel]);
  const pageIds = pageRows.map((r) => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => sel.includes(id));
  const someOnPage = pageIds.some((id) => sel.includes(id)) && !allOnPage;
  const toggleAllOnPage = () =>
    setSel(allOnPage ? sel.filter((id) => !pageIds.includes(id)) : [...new Set([...sel, ...pageIds])]);
  const toggleOne = (id: string) =>
    setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

  // data mobility dialogs
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<null | { key: string; label: string; destructive?: boolean }>(null);

  const filterChips = [
    status !== "all" ? { key: "status", label: `Status: ${status}` } : null,
    tier !== "all" ? { key: "tier", label: `Tier: ${tier}` } : null,
    kyc !== "all" ? { key: "kyc", label: `KYC: ${kyc}` } : null,
    q.trim() ? { key: "q", label: `Search: ${q.trim()}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearFilter = (key: string) => {
    if (key === "status") setStatus("all");
    if (key === "tier") setTier("all");
    if (key === "kyc") setKyc("all");
    if (key === "q") setQ("");
  };
  const clearAllFilters = () => { setStatus("all"); setTier("all"); setKyc("all"); setQ(""); };

  const kpis = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const verified = rows.filter((r) => r.kyc_status === "verified").length;
    return { total, active, pending, verified };
  }, [rows]);


  // drawer state
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === openId) ?? null;

  // create sheet
  const [createOpen, setCreateOpen] = useState(false);

  // action mutations
  const statusMutation = useMutation({
    mutationFn: async (vars: { row: Reseller; status: string; action: string }) => {
      const { data, error } = await supabase
        .from("resellers")
        .update({ status: vars.status })
        .eq("id", vars.row.id)
        .select()
        .single();
      if (error) throw error;
      await recordAction({
        action: `reseller.${vars.action}`,
        entityType: "reseller",
        entityId: vars.row.id,
        summary: `${capitalize(vars.action)} reseller "${vars.row.business_name}"`,
        before: { status: vars.row.status },
        after: { status: data.status },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message || "Action failed (auth/RLS may be off)"),
  });

  const kycMutation = useMutation({
    mutationFn: async (vars: { row: Reseller; kyc_status: string; action: string }) => {
      const { data, error } = await supabase
        .from("resellers")
        .update({ kyc_status: vars.kyc_status })
        .eq("id", vars.row.id)
        .select()
        .single();
      if (error) throw error;
      await recordAction({
        action: `kyc.${vars.action}`,
        entityType: "reseller",
        entityId: vars.row.id,
        summary: `${capitalize(vars.action)} KYC for "${vars.row.business_name}"`,
        before: { kyc_status: vars.row.kyc_status },
        after: { kyc_status: data.kyc_status },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("KYC updated");
    },
    onError: (e: Error) => toast.error(e.message || "Action failed (auth/RLS may be off)"),
  });

  // delete confirm
  const [deleteRow, setDeleteRow] = useState<Reseller | null>(null);
  const deleteMutation = useMutation({
    mutationFn: async (row: Reseller) => {
      const { error } = await supabase.from("resellers").delete().eq("id", row.id);
      if (error) throw error;
      await recordAction({
        action: "reseller.delete",
        entityType: "reseller",
        entityId: row.id,
        summary: `Deleted reseller "${row.business_name}"`,
        before: row,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] });
      setDeleteRow(null);
      if (deleteRow?.id === openId) setOpenId(null);
      toast.success("Reseller deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed (auth/RLS may be off)"),
  });

  // bulk actions
  const bulkMutation = useMutation({
    mutationFn: async (key: string) => {
      const ids = selectedRows.map((r) => r.id);
      if (ids.length === 0) return;
      if (key === "delete") {
        const { error } = await supabase.from("resellers").delete().in("id", ids);
        if (error) throw error;
      } else {
        const patch =
          key === "approve" ? { status: "active" }
          : key === "suspend" ? { status: "suspended" }
          : { kyc_status: "verified" };
        const { error } = await supabase.from("resellers").update(patch).in("id", ids);
        if (error) throw error;
      }
      await Promise.all(selectedRows.map((r) => recordAction({
        action: `reseller.bulk_${key}`,
        entityType: "reseller",
        entityId: r.id,
        summary: `Bulk ${key} on "${r.business_name}"`,
      })));
    },
    onSuccess: (_d, key) => {
      qc.invalidateQueries({ queryKey: ["resellers"] });
      toast.success(`${selectedRows.length} reseller(s) — ${key} applied`);
      setSel([]);
      setBulkConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message || "Bulk action failed (auth/RLS may be off)"),
  });

  const exportColumns = [
    { key: "business_name", header: "Business Name" },
    { key: "code", header: "Code" },
    { key: "email", header: "Email" },
    { key: "contact_name", header: "Contact" },
    { key: "tier", header: "Tier" },
    { key: "status", header: "Status" },
    { key: "kyc_status", header: "KYC" },
    { key: "region", header: "Region" },
    { key: "created_at", header: "Created" },
  ];

  const cellPad = density === "compact" ? "py-1.5" : "";

  return (
    <TooltipProvider delayDuration={200}>

      <WallHeader
        eyebrow="Network"
        title="Resellers Wall"
        subtitle="Every reseller in the network. Search, filter, onboard, verify, suspend, audit."
        actions={
          <>
            <Btn variant="outline" leading={<RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />} onClick={() => refetch()}>
              Refresh
            </Btn>
            <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Reseller</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Total" value={kpis.total} icon={Users} loading={isLoading} hint="In directory" />
        <KPI label="Active" value={kpis.active} icon={CheckCircle2} loading={isLoading} hint="Selling now" />
        <KPI label="Pending" value={kpis.pending} icon={ShieldAlert} loading={isLoading} hint="Awaiting approval" />
        <KPI label="KYC Verified" value={kpis.verified} icon={BadgeCheck} loading={isLoading} hint="Fully compliant" />
      </div>

      <div className="mt-6">
        <SectionCard
          title="Directory"
          description={`${filtered.length} of ${rows.length} resellers`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, code, email…"
                  className="h-8 w-[260px] pl-8 text-[12px]"
                />
              </div>
              <FilterSelect value={status} onValueChange={setStatus} placeholder="Status" options={["all", ...STATUSES]} />
              <FilterSelect value={tier} onValueChange={setTier} placeholder="Tier" options={["all", ...TIERS]} />
              <FilterSelect value={kyc} onValueChange={setKyc} placeholder="KYC" options={["all", ...KYC]} />
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-8 w-[140px] text-[12px]"><ArrowDownUp className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="name">Name A→Z</SelectItem>
                  <SelectItem value="tier">Tier (high)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-muted/60" />)}
            </div>
          ) : isError ? (
            <EmptyState
              icon={XCircle}
              title="Couldn't load resellers"
              description={(error as Error)?.message ?? "An error occurred."}
              action={<Btn variant="outline" onClick={() => refetch()}>Retry</Btn>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={rows.length === 0 ? "No resellers yet" : "No matches"}
              description={rows.length === 0
                ? "Onboard your first reseller to populate the directory. Auth + RLS will gate every action."
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Reseller</Btn>
                : <Btn variant="outline" onClick={() => { setQ(""); setStatus("all"); setTier("all"); setKyc("all"); }}>Clear filters</Btn>}
            />
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Reseller</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary text-[12px] font-bold">
                            {initials(r.business_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold">{r.business_name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{r.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{r.code}</TableCell>
                      <TableCell><TierBadge tier={r.tier} /></TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell><KycBadge status={r.kyc_status} /></TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{r.region ?? "—"}</TableCell>
                      <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          row={r}
                          onAction={(action) => {
                            if (action === "approve") statusMutation.mutate({ row: r, status: "active", action: "approve" });
                            if (action === "suspend") statusMutation.mutate({ row: r, status: "suspended", action: "suspend" });
                            if (action === "reactivate") statusMutation.mutate({ row: r, status: "active", action: "reactivate" });
                            if (action === "reject") statusMutation.mutate({ row: r, status: "rejected", action: "reject" });
                            if (action === "verify") kycMutation.mutate({ row: r, kyc_status: "verified", action: "verify" });
                            if (action === "kyc_reject") kycMutation.mutate({ row: r, kyc_status: "rejected", action: "reject" });
                            if (action === "delete") setDeleteRow(r);
                            if (action === "open") setOpenId(r.id);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>

      <Card className="mt-6 border-dashed bg-surface/40 p-4 text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">Wired end-to-end.</span>{" "}
        Every action (create, approve, suspend, verify, reject, delete) writes to{" "}
        <code>resellers</code>, <code>audit_logs</code>, <code>activity_events</code>, and{" "}
        <code>notifications</code> via <code>recordAction()</code>. Until auth is enabled,
        RLS rejects writes and you'll see a friendly toast.
      </Card>

      {/* Detail Drawer */}
      <DetailDrawer
        row={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setOpenId(null)}
        onAction={(action) => {
          if (!selected) return;
          if (action === "approve") statusMutation.mutate({ row: selected, status: "active", action: "approve" });
          if (action === "suspend") statusMutation.mutate({ row: selected, status: "suspended", action: "suspend" });
          if (action === "reactivate") statusMutation.mutate({ row: selected, status: "active", action: "reactivate" });
          if (action === "reject") statusMutation.mutate({ row: selected, status: "rejected", action: "reject" });
          if (action === "verify") kycMutation.mutate({ row: selected, kyc_status: "verified", action: "verify" });
          if (action === "kyc_reject") kycMutation.mutate({ row: selected, kyc_status: "rejected", action: "reject" });
          if (action === "delete") setDeleteRow(selected);
        }}
      />

      {/* Create Sheet */}
      <CreateSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={() => qc.invalidateQueries({ queryKey: ["resellers"] })} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reseller?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">{deleteRow?.business_name}</span> and is logged to the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRow && deleteMutation.mutate(deleteRow)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ───────── helpers ─────────
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function FilterSelect({ value, onValueChange, placeholder, options }: {
  value: string; onValueChange: (v: string) => void; placeholder: string; options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-[130px] text-[12px]"><Filter className="mr-1 h-3 w-3" /><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o === "all" ? `All ${placeholder}` : capitalize(o)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    suspended: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? ""}`}>{status}</Badge>;
}

function KycBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    submitted: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    unverified: "bg-muted text-muted-foreground border-border",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? ""}`}>{status}</Badge>;
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    platinum: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    gold: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    silver: "bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30",
    bronze: "bg-amber-700/15 text-amber-800 dark:text-amber-300 border-amber-700/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[tier] ?? ""}`}>{tier}</Badge>;
}

type RowAction = "open" | "approve" | "suspend" | "reactivate" | "reject" | "verify" | "kyc_reject" | "delete";

function RowMenu({ row, onAction }: { row: Reseller; onAction: (a: RowAction) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface hover:bg-accent">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider">Manage</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAction("open")}><ChevronsUpDown className="mr-2 h-3.5 w-3.5" />Open detail</DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.status !== "active" && (
          <DropdownMenuItem onClick={() => onAction(row.status === "suspended" ? "reactivate" : "approve")}>
            <Play className="mr-2 h-3.5 w-3.5" />{row.status === "suspended" ? "Reactivate" : "Approve"}
          </DropdownMenuItem>
        )}
        {row.status === "active" && (
          <DropdownMenuItem onClick={() => onAction("suspend")}><Pause className="mr-2 h-3.5 w-3.5" />Suspend</DropdownMenuItem>
        )}
        {row.status !== "rejected" && (
          <DropdownMenuItem onClick={() => onAction("reject")}><XCircle className="mr-2 h-3.5 w-3.5" />Reject</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {row.kyc_status !== "verified" && (
          <DropdownMenuItem onClick={() => onAction("verify")}><ShieldCheck className="mr-2 h-3.5 w-3.5" />Verify KYC</DropdownMenuItem>
        )}
        {row.kyc_status !== "rejected" && (
          <DropdownMenuItem onClick={() => onAction("kyc_reject")}><ShieldAlert className="mr-2 h-3.5 w-3.5" />Reject KYC</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("delete")} className="text-destructive focus:text-destructive">
          <XCircle className="mr-2 h-3.5 w-3.5" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ───────── Detail Drawer ─────────
function DetailDrawer({
  row, open, onOpenChange, onAction,
}: {
  row: Reseller | null; open: boolean; onOpenChange: (o: boolean) => void;
  onAction: (a: RowAction) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {row && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary text-sm font-bold">
                  {initials(row.business_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{row.business_name}</SheetTitle>
                  <SheetDescription className="font-mono text-[11px]">{row.code}</SheetDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={row.status} />
                    <KycBadge status={row.kyc_status} />
                    <TierBadge tier={row.tier} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status !== "active" && (
                  <Btn size="sm" onClick={() => onAction(row.status === "suspended" ? "reactivate" : "approve")} leading={<Play className="h-3.5 w-3.5" />}>
                    {row.status === "suspended" ? "Reactivate" : "Approve"}
                  </Btn>
                )}
                {row.status === "active" && (
                  <Btn size="sm" variant="outline" onClick={() => onAction("suspend")} leading={<Pause className="h-3.5 w-3.5" />}>Suspend</Btn>
                )}
                {row.kyc_status !== "verified" && (
                  <Btn size="sm" variant="outline" onClick={() => onAction("verify")} leading={<ShieldCheck className="h-3.5 w-3.5" />}>Verify KYC</Btn>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="flex w-full flex-wrap gap-1 bg-muted/60 p-1 h-auto">
                <TabsTrigger value="overview" className="text-[11px]">Overview</TabsTrigger>
                <TabsTrigger value="kyc" className="text-[11px]">KYC</TabsTrigger>
                <TabsTrigger value="wallet" className="text-[11px]">Wallet</TabsTrigger>
                <TabsTrigger value="commissions" className="text-[11px]">Commissions</TabsTrigger>
                <TabsTrigger value="licenses" className="text-[11px]">Licenses</TabsTrigger>
                <TabsTrigger value="customers" className="text-[11px]">Customers</TabsTrigger>
                <TabsTrigger value="orders" className="text-[11px]">Orders</TabsTrigger>
                <TabsTrigger value="timeline" className="text-[11px]">Timeline</TabsTrigger>
                <TabsTrigger value="audit" className="text-[11px]">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 pt-4">
                <Card className="p-4">
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
                  <dl className="space-y-2 text-[13px]">
                    <Row icon={Mail} label="Email" value={row.email} />
                    <Row icon={Phone} label="Phone" value={row.phone ?? "—"} />
                    <Row icon={Users} label="Contact name" value={row.contact_name ?? "—"} />
                    <Row icon={MapPin} label="Region" value={row.region ?? "—"} />
                  </dl>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                  <KPI label="Wallet" value="₹0" icon={Wallet} hint="No txns yet" />
                  <KPI label="Commission" value="₹0" icon={Percent} hint="Lifetime" />
                  <KPI label="Orders" value={0} icon={ShoppingCart} hint="All time" />
                  <KPI label="Licenses" value={0} icon={KeyRound} hint="Active" />
                </div>
                {row.notes && (
                  <Card className="p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
                    <p className="whitespace-pre-wrap text-[13px] text-foreground/90">{row.notes}</p>
                  </Card>
                )}
                <Card className="p-4 text-[11px] text-muted-foreground">
                  Created {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
                </Card>
              </TabsContent>

              <TabsContent value="kyc" className="space-y-3 pt-4">
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Verification Status</h4>
                    <KycBadge status={row.kyc_status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <KycItem label="Identity (PAN)" state={row.kyc_status} />
                    <KycItem label="Business Reg." state={row.kyc_status} />
                    <KycItem label="GST" state={row.kyc_status} />
                    <KycItem label="Address Proof" state={row.kyc_status} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    {row.kyc_status !== "verified" && (
                      <Btn size="sm" onClick={() => onAction("verify")} leading={<ShieldCheck className="h-3.5 w-3.5" />}>Verify KYC</Btn>
                    )}
                    {row.kyc_status !== "rejected" && (
                      <Btn size="sm" variant="outline" onClick={() => onAction("kyc_reject")} leading={<ShieldAlert className="h-3.5 w-3.5" />}>Reject KYC</Btn>
                    )}
                  </div>
                </Card>
                <EmptyState compact icon={ShieldCheck} title="No documents uploaded" description="Uploaded KYC documents will appear here with review actions." />
              </TabsContent>

              <TabsContent value="wallet" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Balance" value="₹0" icon={Wallet} hint="Available" />
                  <KPI label="Credits" value="₹0" icon={Percent} hint="Lifetime in" />
                  <KPI label="Debits" value="₹0" icon={Percent} hint="Lifetime out" />
                </div>
                <EmptyState compact icon={Wallet} title="No wallet transactions" description="Credits, debits, adjustments and payouts will appear here." />
              </TabsContent>

              <TabsContent value="commissions" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Pending" value="₹0" icon={Percent} hint="Awaiting approval" />
                  <KPI label="Approved" value="₹0" icon={Percent} hint="Ready for payout" />
                  <KPI label="Paid" value="₹0" icon={Percent} hint="Settled" />
                </div>
                <EmptyState compact icon={Percent} title="No commissions yet" description="Every earned commission line — rule, base, rate, amount — will appear here." />
              </TabsContent>

              <TabsContent value="licenses" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Active" value={0} icon={KeyRound} hint="Currently valid" />
                  <KPI label="Expiring" value={0} icon={KeyRound} hint="Next 30 days" />
                  <KPI label="Revoked" value={0} icon={KeyRound} hint="Lifetime" />
                </div>
                <EmptyState compact icon={KeyRound} title="No licenses issued" description="Issued keys, activations, device bindings and renewals will appear here." />
              </TabsContent>

              <TabsContent value="customers" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Total" value={0} icon={Users} hint="Onboarded" />
                  <KPI label="Active" value={0} icon={Users} hint="Buying now" />
                  <KPI label="LTV" value="₹0" icon={Percent} hint="Lifetime value" />
                </div>
                <EmptyState compact icon={Users} title="No customers yet" description="Customers this reseller has onboarded will appear here." />
              </TabsContent>

              <TabsContent value="orders" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Total" value={0} icon={ShoppingCart} hint="All time" />
                  <KPI label="Revenue" value="₹0" icon={Percent} hint="Gross" />
                  <KPI label="Refunds" value="₹0" icon={Percent} hint="Lifetime" />
                </div>
                <EmptyState compact icon={ShoppingCart} title="No orders yet" description="Orders sourced through this reseller will appear here." />
              </TabsContent>

              <TabsContent value="timeline" className="pt-4">
                <EntityList entityType="reseller" entityId={row.id} kind="activity" />
              </TabsContent>

              <TabsContent value="audit" className="pt-4">
                <EntityList entityType="reseller" entityId={row.id} kind="audit" />
              </TabsContent>
            </Tabs>


            <SheetFooter className="mt-6">
              <Btn variant="outline" onClick={() => onAction("delete")}>Delete reseller</Btn>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
  );
}

function KycItem({ label, state }: { label: string; state: string }) {
  const ok = state === "verified";
  const rej = state === "rejected";
  const Icon = ok ? CheckCircle2 : rej ? XCircle : ShieldAlert;
  const color = ok ? "text-emerald-600 dark:text-emerald-400"
    : rej ? "text-rose-600 dark:text-rose-400"
    : "text-amber-600 dark:text-amber-400";
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface/50 px-2.5 py-2">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <div className="min-w-0 flex-1 truncate text-[12px] font-medium">{label}</div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{ok ? "OK" : rej ? "Rej" : "Pend"}</span>
    </div>
  );
}



// ───────── Activity / Audit / Notifications list ─────────
function EntityList({ entityType, entityId, kind }: { entityType: string; entityId: string; kind: "activity" | "audit" | "notifs" }) {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: [kind, entityType, entityId],
    queryFn: async () => {
      if (kind === "activity") {
        const { data, error } = await supabase.from("activity_events").select("*")
          .eq("entity_type", entityType).eq("entity_id", entityId)
          .order("created_at", { ascending: false }).limit(100);
        if (error) throw error;
        return data as ActivityEvent[];
      }
      if (kind === "audit") {
        const { data, error } = await supabase.from("audit_logs").select("*")
          .eq("entity_type", entityType).eq("entity_id", entityId)
          .order("created_at", { ascending: false }).limit(100);
        if (error) throw error;
        return data as AuditLog[];
      }
      const { data, error } = await supabase.from("notifications").select("*")
        .eq("entity_type", entityType).eq("entity_id", entityId)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Notification[];
    },
  });

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-muted/60" />)}</div>;
  if (isError) {
    return (
      <EmptyState
        compact
        icon={XCircle}
        title="Couldn't load"
        description={(error as Error)?.message ?? "An error occurred."}
      />
    );
  }
  if (data.length === 0) {
    const empty = {
      activity: { icon: Activity, title: "No activity yet", desc: "Events appear here as the reseller is acted on." },
      audit: { icon: ScrollText, title: "No audit entries", desc: "Privileged actions on this reseller will be recorded." },
      notifs: { icon: Bell, title: "No notifications", desc: "Outgoing notifications targeting this reseller will appear here." },
    }[kind];
    return <EmptyState compact icon={empty.icon} title={empty.title} description={empty.desc} />;
  }

  return (
    <ul className="space-y-2">
      {data.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">
                {kind === "activity" && (r as ActivityEvent).summary}
                {kind === "audit" && (r as AuditLog).action}
                {kind === "notifs" && (r as Notification).title}
              </div>
              {kind === "notifs" && (r as Notification).body && (
                <div className="mt-0.5 text-[12px] text-muted-foreground">{(r as Notification).body}</div>
              )}
              {kind === "audit" && (
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {(r as AuditLog).ip ?? "—"} · {(r as AuditLog).actor_id ?? "system"}
                </div>
              )}
            </div>
            <time className="shrink-0 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────── Create Sheet ─────────
function CreateSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    business_name: "", code: "", email: "", contact_name: "", phone: "", region: "",
    tier: "bronze", status: "pending", kyc_status: "unverified", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm({
      business_name: "", code: "", email: "", contact_name: "", phone: "", region: "",
      tier: "bronze", status: "pending", kyc_status: "unverified", notes: "",
    });
  }

  async function submit() {
    if (!form.business_name || !form.code || !form.email) {
      toast.error("Business name, code and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("resellers")
        .insert({
          business_name: form.business_name,
          code: form.code,
          email: form.email,
          contact_name: form.contact_name || null,
          phone: form.phone || null,
          region: form.region || null,
          tier: form.tier,
          status: form.status,
          kyc_status: form.kyc_status,
          notes: form.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      await recordAction({
        action: "reseller.create",
        entityType: "reseller",
        entityId: data.id,
        summary: `Onboarded reseller "${data.business_name}"`,
        after: data,
      });
      toast.success("Reseller created");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error((e as Error).message || "Create failed (auth/RLS may be off)");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Onboard reseller</SheetTitle>
          <SheetDescription>Create a new reseller record. Logged to audit + activity.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <Field label="Business name *" v={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} placeholder="Acme Pvt Ltd" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code *" v={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="ACME-001" />
            <Field label="Email *" v={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="ops@acme.in" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name" v={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} placeholder="Priya Sharma" />
            <Field label="Phone" v={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 …" />
          </div>
          <Field label="Region" v={form.region} onChange={(v) => setForm({ ...form, region: v })} placeholder="North India" />

          <div className="grid grid-cols-3 gap-3">
            <PickField label="Tier" value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} options={[...TIERS]} />
            <PickField label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[...STATUSES]} />
            <PickField label="KYC" value={form.kyc_status} onChange={(v) => setForm({ ...form, kyc_status: v })} options={[...KYC]} />
          </div>

          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Internal notes about this reseller…"
              className="mt-1"
            />
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row justify-end gap-2 sm:justify-end">
          <Btn variant="outline" onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn onClick={submit}>{submitting ? "Creating…" : "Create reseller"}</Btn>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, v, onChange, type = "text", placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}

function PickField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{capitalize(o)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
