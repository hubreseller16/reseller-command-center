import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Search, Filter, MoreHorizontal, XCircle, ArrowDownUp,
  UserCheck, Building2, Mail, Phone, MapPin, ShoppingCart, DollarSign,
  Ban, CheckCircle2, Layers, Star, Trash2, Snowflake, Activity,
} from "lucide-react";

import { WallHeader } from "@/components/wall/Shell";
import { Btn, Card, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { BulkBar } from "@/components/wall/BulkBar";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { recordAction } from "@/lib/recordAction";
import { useRegisterSearchScope, consumePendingOpen } from "@/lib/searchIndex";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [
    { title: "Customers — Reseller Manager" },
    { name: "description", content: "Every customer brought in by every reseller." },
  ] }),
  component: CustomersWall,
});

type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: "individual" | "sme" | "enterprise";
  status: "active" | "inactive" | "blocked";
  reseller: string;
  region: string;
  ltv: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

const SEGMENTS = ["individual", "sme", "enterprise"] as const;
const STATUSES = ["active", "inactive", "blocked"] as const;

function CustomersWall() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [segment, setSegment] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "name" | "ltv">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Customer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | { key: string }>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => {
      if (status !== "all" && x.status !== status) return false;
      if (segment !== "all" && x.segment !== segment) return false;
      if (term && !`${x.name} ${x.company} ${x.email} ${x.region} ${x.reseller}`.toLowerCase().includes(term)) return false;
      return true;
    });
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "ltv") r = [...r].sort((a, b) => b.ltv - a.ltv);
    return r;
  }, [rows, q, status, segment, sort]);

  const kpis = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    orgs: new Set(rows.filter((r) => r.company).map((r) => r.company)).size,
    ltv: rows.reduce((s, r) => s + r.ltv, 0),
  }), [rows]);

  const selected = rows.find((r) => r.id === openId) ?? null;

  const entries = useMemo(() => rows.map((r) => ({
    scope: "customers", id: r.id, label: r.name,
    sub: `${r.company || "Individual"} · ${r.segment} · ₹${r.ltv.toLocaleString()}`,
    route: "/customers",
    hay: `${r.email} ${r.company} ${r.region} ${r.reseller}`,
  })), [rows]);
  useRegisterSearchScope("customers", entries);
  useEffect(() => { const p = consumePendingOpen("customers"); if (p) setOpenId(p); }, [rows]);

  const toggleOne = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? new Set(filtered.map((r) => r.id)) : new Set());
  const clearSel = () => setSelectedIds(new Set());
  const allChecked = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const runBulk = (key: string) => {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0) return;
    if (key === "delete") {
      const ids = new Set(targets.map((r) => r.id));
      setRows((p) => p.filter((r) => !ids.has(r.id)));
      targets.forEach((r) => void recordAction({ action: "customer.bulk_delete", entityType: "customer", entityId: r.id, summary: `Bulk removed "${r.name}"`, before: r }));
      if (openId && ids.has(openId)) setOpenId(null);
      toast.success(`Removed ${targets.length} customer${targets.length === 1 ? "" : "s"}`);
    } else {
      const status: Customer["status"] = key === "activate" ? "active" : key === "freeze" ? "inactive" : "blocked";
      setRows((p) => p.map((r) => (selectedIds.has(r.id) ? { ...r, status, updated_at: new Date().toISOString() } : r)));
      targets.forEach((r) => void recordAction({ action: `customer.bulk_${key}`, entityType: "customer", entityId: r.id, summary: `Bulk ${key} "${r.name}"`, before: r, after: { ...r, status } }));
      toast.success(`${cap(key)} ${targets.length} customer${targets.length === 1 ? "" : "s"}`);
    }
    clearSel(); setBulkConfirm(null);
  };


  const setStatusFor = (row: Customer, next: Customer["status"], action: string) => {
    const updated = { ...row, status: next, updated_at: new Date().toISOString() };
    setRows((p) => p.map((r) => (r.id === row.id ? updated : r)));
    void recordAction({ action: `customer.${action}`, entityType: "customer", entityId: row.id, summary: `${cap(action)} customer "${row.name}"`, before: row, after: updated });
    toast.success(`${cap(action)} customer "${row.name}"`);
  };

  const onAction = (row: Customer, action: string) => {
    if (action === "open") return setOpenId(row.id);
    if (action === "delete") return setDeleteRow(row);
    if (action === "activate") return setStatusFor(row, "active", "activate");
    if (action === "deactivate") return setStatusFor(row, "inactive", "deactivate");
    if (action === "block") return setStatusFor(row, "blocked", "block");
  };

  return (
    <>
      <WallHeader
        eyebrow="Network"
        title="Customers Wall"
        subtitle="Every end-customer owned by every reseller — searchable, segmentable and actionable."
        actions={<Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>Add Customer</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Total Customers" value={kpis.total} icon={Users} />
        <KPI label="Active" value={kpis.active} icon={UserCheck} hint="Currently buying" />
        <KPI label="Organizations" value={kpis.orgs} icon={Building2} hint="Unique companies" />
        <KPI label="Lifetime Value" value={`₹${kpis.ltv.toLocaleString()}`} icon={DollarSign} hint="All customers" />
      </div>

      <div className="mt-6">
        <SectionCard
          title="Customer Directory"
          description={`${filtered.length} of ${rows.length} customers`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, email…" className="h-8 w-[260px] pl-8 text-[12px]" />
              </div>
              <FilterSelect value={status} onValueChange={setStatus} placeholder="Status" options={["all", ...STATUSES]} />
              <FilterSelect value={segment} onValueChange={setSegment} placeholder="Segment" options={["all", ...SEGMENTS]} />
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-8 w-[140px] text-[12px]"><ArrowDownUp className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="name">Name A→Z</SelectItem>
                  <SelectItem value="ltv">LTV (high)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={rows.length === 0 ? "No customers yet" : "No matches"}
              description={rows.length === 0
                ? "Add your first customer to start tracking accounts, LTV and history."
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>Add Customer</Btn>
                : <Btn variant="outline" onClick={() => { setQ(""); setStatus("all"); setSegment("all"); }}>Clear filters</Btn>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary text-[12px] font-bold">
                          {initials(r.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold">{r.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{r.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{r.company || "—"}</TableCell>
                    <TableCell><SegmentBadge segment={r.segment} /></TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{r.reseller || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">₹{r.ltv.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                      <RowMenu row={r} onAction={(a) => onAction(r, a)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <CustomerDrawer row={selected} open={!!selected} onOpenChange={(o) => !o && setOpenId(null)} onAction={(a) => selected && onAction(selected, a)} />

      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(data) => {
          const now = new Date().toISOString();
          const row: Customer = { ...data, id: crypto.randomUUID(), ltv: 0, created_at: now, updated_at: now };
          setRows((p) => [row, ...p]);
          void recordAction({ action: "customer.create", entityType: "customer", entityId: row.id, summary: `Added customer "${row.name}"`, after: row });
          toast.success("Customer added");
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">{deleteRow?.name}</span>. Order history is retained.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteRow) return;
                setRows((p) => p.filter((r) => r.id !== deleteRow.id));
                void recordAction({ action: "customer.delete", entityType: "customer", entityId: deleteRow.id, summary: `Deleted "${deleteRow.name}"`, before: deleteRow });
                if (openId === deleteRow.id) setOpenId(null);
                setDeleteRow(null);
                toast.success("Customer removed");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FilterSelect({ value, onValueChange, placeholder, options }: {
  value: string; onValueChange: (v: string) => void; placeholder: string; options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-[140px] text-[12px]"><Filter className="mr-1 h-3 w-3" /><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o === "all" ? `All ${placeholder}` : cap(o)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    inactive: "bg-muted text-muted-foreground border-border",
    blocked: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? ""}`}>{status}</Badge>;
}

function SegmentBadge({ segment }: { segment: string }) {
  const map: Record<string, string> = {
    enterprise: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    sme: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    individual: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[segment] ?? ""}`}>{segment}</Badge>;
}

function RowMenu({ row, onAction }: { row: Customer; onAction: (a: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface hover:bg-accent">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider">Manage</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAction("open")}><Layers className="mr-2 h-3.5 w-3.5" />Open detail</DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.status !== "active" && <DropdownMenuItem onClick={() => onAction("activate")}><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Activate</DropdownMenuItem>}
        {row.status === "active" && <DropdownMenuItem onClick={() => onAction("deactivate")}><Ban className="mr-2 h-3.5 w-3.5" />Deactivate</DropdownMenuItem>}
        {row.status !== "blocked" && <DropdownMenuItem onClick={() => onAction("block")}><Ban className="mr-2 h-3.5 w-3.5" />Block</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("delete")} className="text-destructive focus:text-destructive">
          <XCircle className="mr-2 h-3.5 w-3.5" />Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CustomerDrawer({ row, open, onOpenChange, onAction }: {
  row: Customer | null; open: boolean; onOpenChange: (o: boolean) => void; onAction: (a: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {row && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary text-sm font-bold">
                  {initials(row.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{row.name}</SheetTitle>
                  <SheetDescription className="truncate">{row.company || "Individual"}</SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge status={row.status} />
                    <SegmentBadge segment={row.segment} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status !== "active" && <Btn size="sm" onClick={() => onAction("activate")} leading={<CheckCircle2 className="h-3.5 w-3.5" />}>Activate</Btn>}
                {row.status === "active" && <Btn size="sm" variant="outline" onClick={() => onAction("deactivate")} leading={<Ban className="h-3.5 w-3.5" />}>Deactivate</Btn>}
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="flex w-full flex-wrap gap-1 bg-muted/60 p-1 h-auto">
                <TabsTrigger value="overview" className="text-[11px]">Overview</TabsTrigger>
                <TabsTrigger value="orders" className="text-[11px]">Orders</TabsTrigger>
                <TabsTrigger value="subs" className="text-[11px]">Subscriptions</TabsTrigger>
                <TabsTrigger value="invoices" className="text-[11px]">Invoices</TabsTrigger>
                <TabsTrigger value="support" className="text-[11px]">Support</TabsTrigger>
                <TabsTrigger value="activity" className="text-[11px]">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 pt-4">
                <Card className="p-4">
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
                  <dl className="space-y-2 text-[13px]">
                    <RowKV icon={Mail} label="Email" value={row.email} />
                    <RowKV icon={Phone} label="Phone" value={row.phone || "—"} />
                    <RowKV icon={Building2} label="Company" value={row.company || "—"} />
                    <RowKV icon={MapPin} label="Region" value={row.region || "—"} />
                    <RowKV icon={Users} label="Reseller" value={row.reseller || "—"} />
                  </dl>
                </Card>
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="LTV" value={`₹${row.ltv.toLocaleString()}`} icon={DollarSign} />
                  <KPI label="Orders" value={0} icon={ShoppingCart} />
                  <KPI label="Rating" value="—" icon={Star} />
                </div>
                {row.notes && (
                  <Card className="p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
                    <p className="whitespace-pre-wrap text-[13px]">{row.notes}</p>
                  </Card>
                )}
                <Card className="p-4 text-[11px] text-muted-foreground">
                  Added {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="pt-4">
                <EmptyState compact icon={ShoppingCart} title="No orders yet" description="Every order placed by this customer will appear here." />
              </TabsContent>
              <TabsContent value="subs" className="pt-4">
                <EmptyState compact icon={Layers} title="No subscriptions" description="Active and past subscriptions will be listed here." />
              </TabsContent>
              <TabsContent value="invoices" className="pt-4">
                <EmptyState compact icon={DollarSign} title="No invoices" description="Issued invoices, receipts and payment status will appear here." />
              </TabsContent>
              <TabsContent value="support" className="pt-4">
                <EmptyState compact icon={Activity} title="No tickets" description="Support tickets raised by this customer will appear here." />
              </TabsContent>
              <TabsContent value="activity" className="pt-4">
                <EmptyState compact icon={Activity} title="No activity yet" description="Sign-ins, purchases and touch-points will appear here." />
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-6">
              <Btn variant="outline" onClick={() => onAction("delete")}>Remove customer</Btn>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RowKV({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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

function CreateSheet({ open, onOpenChange, onCreate }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onCreate: (d: Omit<Customer, "id" | "created_at" | "updated_at" | "ltv">) => void;
}) {
  const [f, setF] = useState({
    name: "", company: "", email: "", phone: "",
    segment: "sme" as Customer["segment"], status: "active" as Customer["status"],
    reseller: "", region: "", notes: "",
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim()) return toast.error("Name and email are required");
    onCreate(f);
    setF({ name: "", company: "", email: "", phone: "", segment: "sme", status: "active", reseller: "", region: "", notes: "" });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Customer</SheetTitle>
          <SheetDescription>Add a customer to the network directory.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Priya Sharma" /></Field>
            <Field label="Company"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} placeholder="Acme Ltd" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="priya@acme.com" /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91…" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Segment">
              <Select value={f.segment} onValueChange={(v) => setF({ ...f, segment: v as Customer["segment"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEGMENTS.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Customer["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reseller"><Input value={f.reseller} onChange={(e) => setF({ ...f, reseller: e.target.value })} placeholder="Reseller name/code" /></Field>
            <Field label="Region"><Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} placeholder="North India" /></Field>
          </div>
          <Field label="Notes"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <SheetFooter className="gap-2 pt-2">
            <Btn variant="outline" onClick={() => onOpenChange(false)}>Cancel</Btn>
            <Btn type="submit">Add Customer</Btn>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
