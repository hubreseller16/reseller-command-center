import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingCart, Plus, Search, Filter, MoreHorizontal, XCircle, ArrowDownUp,
  CheckCircle2, Clock, Truck, Package, DollarSign, Receipt, Layers, RotateCcw,
  User, Building2, Mail, Trash2, Pause,
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

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [
    { title: "Orders — Reseller Manager" },
    { name: "description", content: "Every order across the reseller network." },
  ] }),
  component: OrdersWall,
});

type Order = {
  id: string;
  number: string;
  customer: string;
  customer_email: string;
  reseller: string;
  product: string;
  qty: number;
  amount: number;
  currency: string;
  payment: "paid" | "unpaid" | "refunded";
  status: "pending" | "processing" | "fulfilled" | "cancelled";
  notes: string;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["pending", "processing", "fulfilled", "cancelled"] as const;
const PAYMENTS = ["paid", "unpaid", "refunded"] as const;

function OrdersWall() {
  const [rows, setRows] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [payment, setPayment] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "amount" | "customer">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => {
      if (status !== "all" && x.status !== status) return false;
      if (payment !== "all" && x.payment !== payment) return false;
      if (term && !`${x.number} ${x.customer} ${x.reseller} ${x.product} ${x.customer_email}`.toLowerCase().includes(term)) return false;
      return true;
    });
    if (sort === "amount") r = [...r].sort((a, b) => b.amount - a.amount);
    if (sort === "customer") r = [...r].sort((a, b) => a.customer.localeCompare(b.customer));
    return r;
  }, [rows, q, status, payment, sort]);

  const kpis = useMemo(() => ({
    total: rows.length,
    fulfilled: rows.filter((r) => r.status === "fulfilled").length,
    pending: rows.filter((r) => r.status === "pending" || r.status === "processing").length,
    revenue: rows.filter((r) => r.payment === "paid").reduce((s, r) => s + r.amount, 0),
  }), [rows]);

  const selected = rows.find((r) => r.id === openId) ?? null;

  const setStatusFor = (row: Order, patch: Partial<Order>, action: string, summary: string) => {
    const updated = { ...row, ...patch, updated_at: new Date().toISOString() };
    setRows((p) => p.map((r) => (r.id === row.id ? updated : r)));
    void recordAction({ action: `order.${action}`, entityType: "order", entityId: row.id, summary, before: row, after: updated });
    toast.success(summary);
  };

  const onAction = (row: Order, action: string) => {
    if (action === "open") return setOpenId(row.id);
    if (action === "delete") return setDeleteRow(row);
    if (action === "process") return setStatusFor(row, { status: "processing" }, "process", `Processing ${row.number}`);
    if (action === "fulfill") return setStatusFor(row, { status: "fulfilled" }, "fulfill", `Fulfilled ${row.number}`);
    if (action === "cancel") return setStatusFor(row, { status: "cancelled" }, "cancel", `Cancelled ${row.number}`);
    if (action === "mark_paid") return setStatusFor(row, { payment: "paid" }, "paid", `Marked ${row.number} paid`);
    if (action === "refund") return setStatusFor(row, { payment: "refunded" }, "refund", `Refunded ${row.number}`);
  };

  return (
    <>
      <WallHeader
        eyebrow="Commerce"
        title="Orders Wall"
        subtitle="The complete order pipeline — from cart to fulfilment to revenue recognition."
        actions={<Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Order</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Total Orders" value={kpis.total} icon={ShoppingCart} />
        <KPI label="Fulfilled" value={kpis.fulfilled} icon={CheckCircle2} hint="Completed" />
        <KPI label="In Pipeline" value={kpis.pending} icon={Clock} hint="Pending + processing" />
        <KPI label="Revenue" value={`₹${kpis.revenue.toLocaleString()}`} icon={DollarSign} hint="Paid orders" />
      </div>

      <div className="mt-6">
        <SectionCard
          title="Order Pipeline"
          description={`${filtered.length} of ${rows.length} orders`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search #, customer, product…" className="h-8 w-[260px] pl-8 text-[12px]" />
              </div>
              <FilterSelect value={status} onValueChange={setStatus} placeholder="Status" options={["all", ...STATUSES]} />
              <FilterSelect value={payment} onValueChange={setPayment} placeholder="Payment" options={["all", ...PAYMENTS]} />
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-8 w-[140px] text-[12px]"><ArrowDownUp className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="amount">Amount (high)</SelectItem>
                  <SelectItem value="customer">Customer A→Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={rows.length === 0 ? "No orders yet" : "No matches"}
              description={rows.length === 0
                ? "Create your first order to start tracking fulfilment and revenue."
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Order</Btn>
                : <Btn variant="outline" onClick={() => { setQ(""); setStatus("all"); setPayment("all"); }}>Clear filters</Btn>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                    <TableCell className="pl-5">
                      <div className="min-w-0">
                        <div className="font-mono text-[12px] font-semibold">{r.number}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">{r.customer}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{r.reseller || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">{r.product}</TableCell>
                    <TableCell className="text-right text-[12px]">{r.qty}</TableCell>
                    <TableCell className="text-right font-semibold">{r.currency} {r.amount.toLocaleString()}</TableCell>
                    <TableCell><PaymentBadge payment={r.payment} /></TableCell>
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

      <OrderDrawer row={selected} open={!!selected} onOpenChange={(o) => !o && setOpenId(null)} onAction={(a) => selected && onAction(selected, a)} />

      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(data) => {
          const now = new Date().toISOString();
          const num = `ORD-${Date.now().toString().slice(-6)}`;
          const row: Order = { ...data, id: crypto.randomUUID(), number: num, created_at: now, updated_at: now };
          setRows((p) => [row, ...p]);
          void recordAction({ action: "order.create", entityType: "order", entityId: row.id, summary: `Created ${num} for "${row.customer}"`, after: row });
          toast.success(`Order ${num} created`);
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">{deleteRow?.number}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteRow) return;
                setRows((p) => p.filter((r) => r.id !== deleteRow.id));
                void recordAction({ action: "order.delete", entityType: "order", entityId: deleteRow.id, summary: `Deleted ${deleteRow.number}`, before: deleteRow });
                if (openId === deleteRow.id) setOpenId(null);
                setDeleteRow(null);
                toast.success("Order deleted");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Delete</AlertDialogAction>
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
    fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    processing: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? ""}`}>{status}</Badge>;
}

function PaymentBadge({ payment }: { payment: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    unpaid: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    refunded: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[payment] ?? ""}`}>{payment}</Badge>;
}

function RowMenu({ row, onAction }: { row: Order; onAction: (a: string) => void }) {
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
        {row.status === "pending" && <DropdownMenuItem onClick={() => onAction("process")}><Package className="mr-2 h-3.5 w-3.5" />Move to processing</DropdownMenuItem>}
        {row.status !== "fulfilled" && row.status !== "cancelled" && <DropdownMenuItem onClick={() => onAction("fulfill")}><Truck className="mr-2 h-3.5 w-3.5" />Mark fulfilled</DropdownMenuItem>}
        {row.status !== "cancelled" && <DropdownMenuItem onClick={() => onAction("cancel")}><XCircle className="mr-2 h-3.5 w-3.5" />Cancel</DropdownMenuItem>}
        <DropdownMenuSeparator />
        {row.payment !== "paid" && <DropdownMenuItem onClick={() => onAction("mark_paid")}><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Mark paid</DropdownMenuItem>}
        {row.payment === "paid" && <DropdownMenuItem onClick={() => onAction("refund")}><RotateCcw className="mr-2 h-3.5 w-3.5" />Refund</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("delete")} className="text-destructive focus:text-destructive">
          <XCircle className="mr-2 h-3.5 w-3.5" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrderDrawer({ row, open, onOpenChange, onAction }: {
  row: Order | null; open: boolean; onOpenChange: (o: boolean) => void; onAction: (a: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {row && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary"><Receipt className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate font-mono">{row.number}</SheetTitle>
                  <SheetDescription className="truncate">{row.customer} · {row.product}</SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge status={row.status} />
                    <PaymentBadge payment={row.payment} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status === "pending" && <Btn size="sm" onClick={() => onAction("process")} leading={<Package className="h-3.5 w-3.5" />}>Process</Btn>}
                {row.status !== "fulfilled" && row.status !== "cancelled" && <Btn size="sm" onClick={() => onAction("fulfill")} leading={<Truck className="h-3.5 w-3.5" />}>Fulfill</Btn>}
                {row.payment !== "paid" && <Btn size="sm" variant="outline" onClick={() => onAction("mark_paid")} leading={<CheckCircle2 className="h-3.5 w-3.5" />}>Mark paid</Btn>}
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="flex w-full flex-wrap gap-1 bg-muted/60 p-1 h-auto">
                <TabsTrigger value="overview" className="text-[11px]">Overview</TabsTrigger>
                <TabsTrigger value="items" className="text-[11px]">Items</TabsTrigger>
                <TabsTrigger value="payment" className="text-[11px]">Payment</TabsTrigger>
                <TabsTrigger value="fulfillment" className="text-[11px]">Fulfillment</TabsTrigger>
                <TabsTrigger value="invoice" className="text-[11px]">Invoice</TabsTrigger>
                <TabsTrigger value="timeline" className="text-[11px]">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 pt-4">
                <Card className="p-4">
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</h4>
                  <dl className="space-y-2 text-[13px]">
                    <RowKV icon={User} label="Name" value={row.customer} />
                    <RowKV icon={Mail} label="Email" value={row.customer_email || "—"} />
                    <RowKV icon={Building2} label="Reseller" value={row.reseller || "—"} />
                  </dl>
                </Card>
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Amount" value={`${row.currency} ${row.amount.toLocaleString()}`} icon={DollarSign} />
                  <KPI label="Quantity" value={row.qty} icon={Package} />
                  <KPI label="Unit" value={`${row.currency} ${(row.amount / Math.max(row.qty, 1)).toFixed(2)}`} icon={Receipt} />
                </div>
                {row.notes && (
                  <Card className="p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
                    <p className="whitespace-pre-wrap text-[13px]">{row.notes}</p>
                  </Card>
                )}
                <Card className="p-4 text-[11px] text-muted-foreground">
                  Placed {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
                </Card>
              </TabsContent>

              <TabsContent value="items" className="pt-4">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right pr-5">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pl-5 text-[13px] font-medium">{row.product}</TableCell>
                        <TableCell className="text-right">{row.qty}</TableCell>
                        <TableCell className="text-right">{row.currency} {(row.amount / Math.max(row.qty, 1)).toFixed(2)}</TableCell>
                        <TableCell className="text-right pr-5 font-semibold">{row.currency} {row.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-3 pt-4">
                <Card className="p-4">
                  <dl className="space-y-2 text-[13px]">
                    <RowKV icon={DollarSign} label="Amount due" value={`${row.currency} ${row.amount.toLocaleString()}`} />
                    <RowKV icon={CheckCircle2} label="Status" value={row.payment} />
                  </dl>
                </Card>
                <EmptyState compact icon={DollarSign} title="No payment records" description="Payments, refunds and reconciliations will appear here." />
              </TabsContent>

              <TabsContent value="fulfillment" className="pt-4">
                <EmptyState compact icon={Truck} title="No fulfillment steps" description="Pack, ship, track and delivery events will appear here." />
              </TabsContent>

              <TabsContent value="invoice" className="pt-4">
                <EmptyState compact icon={Receipt} title="No invoice issued" description="Generate an invoice from this order to send to the customer." action={<Btn size="sm" variant="outline">Generate invoice</Btn>} />
              </TabsContent>

              <TabsContent value="timeline" className="pt-4">
                <EmptyState compact icon={Clock} title="No timeline events" description="Order lifecycle events will be tracked here." />
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-6">
              <Btn variant="outline" onClick={() => onAction("delete")}>Delete order</Btn>
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
  onCreate: (d: Omit<Order, "id" | "number" | "created_at" | "updated_at">) => void;
}) {
  const [f, setF] = useState({
    customer: "", customer_email: "", reseller: "", product: "", qty: 1, amount: 0,
    currency: "INR",
    payment: "unpaid" as Order["payment"],
    status: "pending" as Order["status"],
    notes: "",
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.customer.trim() || !f.product.trim()) return toast.error("Customer and product are required");
    onCreate(f);
    setF({ customer: "", customer_email: "", reseller: "", product: "", qty: 1, amount: 0, currency: "INR", payment: "unpaid", status: "pending", notes: "" });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New Order</SheetTitle>
          <SheetDescription>Create an order on behalf of a reseller.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer"><Input value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} placeholder="Priya Sharma" /></Field>
            <Field label="Customer email"><Input type="email" value={f.customer_email} onChange={(e) => setF({ ...f, customer_email: e.target.value })} /></Field>
          </div>
          <Field label="Reseller"><Input value={f.reseller} onChange={(e) => setF({ ...f, reseller: e.target.value })} placeholder="Reseller name/code" /></Field>
          <Field label="Product"><Input value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} placeholder="Acme Pro Suite" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty"><Input type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })} /></Field>
            <Field label="Amount"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} /></Field>
            <Field label="Currency">
              <Select value={f.currency} onValueChange={(v) => setF({ ...f, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Order["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Payment">
              <Select value={f.payment} onValueChange={(v) => setF({ ...f, payment: v as Order["payment"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENTS.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Notes"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <SheetFooter className="gap-2 pt-2">
            <Btn variant="outline" onClick={() => onOpenChange(false)}>Cancel</Btn>
            <Btn type="submit">Create Order</Btn>
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

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
