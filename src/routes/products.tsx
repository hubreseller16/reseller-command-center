import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Package, Plus, Search, Filter, MoreHorizontal, Archive, CheckCircle2, XCircle,
  ArrowDownUp, TrendingUp, ShoppingCart, Tag, DollarSign, Layers, Copy, Play, Pause, Trash2,
} from "lucide-react";

import { WallHeader } from "@/components/wall/Shell";
import { Btn, Card, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { BulkBar } from "@/components/wall/BulkBar";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
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

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [
    { title: "Products — Reseller Manager" },
    { name: "description", content: "Manage every product offered to resellers." },
  ] }),
  component: ProductsWall,
});

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  license_type: "subscription" | "perpetual" | "usage";
  billing_cycle: "monthly" | "quarterly" | "yearly" | "one-time";
  status: "draft" | "active" | "archived";
  visibility: "public" | "private";
  description: string;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = ["Software", "Hardware", "Service", "Subscription", "Bundle"] as const;
const STATUSES = ["draft", "active", "archived"] as const;
const LICENSES = ["subscription", "perpetual", "usage"] as const;
const CYCLES = ["monthly", "quarterly", "yearly", "one-time"] as const;

function ProductsWall() {
  const [rows, setRows] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "name" | "price">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | { key: string; label: string }>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => {
      if (status !== "all" && x.status !== status) return false;
      if (category !== "all" && x.category !== category) return false;
      if (term && !`${x.name} ${x.sku} ${x.category} ${x.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [rows, q, status, category, sort]);

  const kpis = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    drafts: rows.filter((r) => r.status === "draft").length,
    value: rows.reduce((s, r) => s + r.price * r.stock, 0),
  }), [rows]);

  const selected = rows.find((r) => r.id === openId) ?? null;

  function apply(update: (p: Product) => Product, action: string, summary: string) {
    setRows((prev) => prev.map((p) => (p.id === (selected?.id ?? p.id) ? p : p)));
    return (row: Product) => {
      const updated = { ...update(row), updated_at: new Date().toISOString() };
      setRows((prev) => prev.map((p) => (p.id === row.id ? updated : p)));
      void recordAction({ action: `product.${action}`, entityType: "product", entityId: row.id, summary, before: row, after: updated });
      toast.success(summary);
    };
  }

  const onAction = (row: Product, action: string) => {
    if (action === "open") return setOpenId(row.id);
    if (action === "delete") return setDeleteRow(row);
    if (action === "duplicate") {
      const copy: Product = { ...row, id: crypto.randomUUID(), sku: `${row.sku}-COPY`, name: `${row.name} (Copy)`, status: "draft", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setRows((p) => [copy, ...p]);
      void recordAction({ action: "product.duplicate", entityType: "product", entityId: copy.id, summary: `Duplicated "${row.name}"`, after: copy });
      return toast.success("Product duplicated");
    }
    if (action === "publish") return apply((r) => ({ ...r, status: "active" }), "publish", `Published "${row.name}"`)(row);
    if (action === "archive") return apply((r) => ({ ...r, status: "archived" }), "archive", `Archived "${row.name}"`)(row);
    if (action === "draft") return apply((r) => ({ ...r, status: "draft" }), "draft", `Moved "${row.name}" to draft`)(row);
  };

  return (
    <>
      <WallHeader
        eyebrow="Catalog"
        title="Products Wall"
        subtitle="Create, price, version and publish every product in the reseller catalog."
        actions={<Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Product</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Total Products" value={kpis.total} icon={Package} hint="In catalog" />
        <KPI label="Active SKUs" value={kpis.active} icon={ShoppingCart} hint="Published" />
        <KPI label="Drafts" value={kpis.drafts} icon={Archive} hint="Not live" />
        <KPI label="Inventory Value" value={`₹${kpis.value.toLocaleString()}`} icon={TrendingUp} hint="Price × stock" />
      </div>

      <div className="mt-6">
        <SectionCard
          title="Catalog"
          description={`${filtered.length} of ${rows.length} products`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU…" className="h-8 w-[240px] pl-8 text-[12px]" />
              </div>
              <FilterSelect value={status} onValueChange={setStatus} placeholder="Status" options={["all", ...STATUSES]} />
              <FilterSelect value={category} onValueChange={setCategory} placeholder="Category" options={["all", ...CATEGORIES]} />
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="h-8 w-[140px] text-[12px]"><ArrowDownUp className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="name">Name A→Z</SelectItem>
                  <SelectItem value="price">Price (high)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title={rows.length === 0 ? "No products yet" : "No matches"}
              description={rows.length === 0
                ? "Add your first product. Set pricing, license type and billing cycle."
                : "Try clearing filters or adjusting your search."}
              action={rows.length === 0
                ? <Btn leading={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>New Product</Btn>
                : <Btn variant="outline" onClick={() => { setQ(""); setStatus("all"); setCategory("all"); }}>Clear filters</Btn>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary"><Package className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold">{r.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{r.license_type} · {r.billing_cycle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{r.sku}</TableCell>
                    <TableCell className="text-[12px]">{r.category}</TableCell>
                    <TableCell className="text-right font-semibold">₹{r.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[12px]">{r.stock}</TableCell>
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

      <ProductDrawer row={selected} open={!!selected} onOpenChange={(o) => !o && setOpenId(null)} onAction={(a) => selected && onAction(selected, a)} />

      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(data) => {
          const now = new Date().toISOString();
          const row: Product = { ...data, id: crypto.randomUUID(), created_at: now, updated_at: now };
          setRows((p) => [row, ...p]);
          void recordAction({ action: "product.create", entityType: "product", entityId: row.id, summary: `Created product "${row.name}"`, after: row });
          toast.success("Product created");
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">{deleteRow?.name}</span> from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteRow) return;
                setRows((p) => p.filter((r) => r.id !== deleteRow.id));
                void recordAction({ action: "product.delete", entityType: "product", entityId: deleteRow.id, summary: `Deleted "${deleteRow.name}"`, before: deleteRow });
                if (openId === deleteRow.id) setOpenId(null);
                setDeleteRow(null);
                toast.success("Product deleted");
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
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    draft: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? ""}`}>{status}</Badge>;
}

function RowMenu({ row, onAction }: { row: Product; onAction: (a: string) => void }) {
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
        {row.status !== "active" && <DropdownMenuItem onClick={() => onAction("publish")}><Play className="mr-2 h-3.5 w-3.5" />Publish</DropdownMenuItem>}
        {row.status === "active" && <DropdownMenuItem onClick={() => onAction("draft")}><Pause className="mr-2 h-3.5 w-3.5" />Move to draft</DropdownMenuItem>}
        {row.status !== "archived" && <DropdownMenuItem onClick={() => onAction("archive")}><Archive className="mr-2 h-3.5 w-3.5" />Archive</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => onAction("duplicate")}><Copy className="mr-2 h-3.5 w-3.5" />Duplicate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("delete")} className="text-destructive focus:text-destructive">
          <XCircle className="mr-2 h-3.5 w-3.5" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProductDrawer({ row, open, onOpenChange, onAction }: {
  row: Product | null; open: boolean; onOpenChange: (o: boolean) => void; onAction: (a: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {row && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary"><Package className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{row.name}</SheetTitle>
                  <SheetDescription className="font-mono text-[11px]">{row.sku}</SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-1.5"><StatusBadge status={row.status} /></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status !== "active" && <Btn size="sm" onClick={() => onAction("publish")} leading={<Play className="h-3.5 w-3.5" />}>Publish</Btn>}
                {row.status === "active" && <Btn size="sm" variant="outline" onClick={() => onAction("draft")} leading={<Pause className="h-3.5 w-3.5" />}>Draft</Btn>}
                <Btn size="sm" variant="outline" onClick={() => onAction("duplicate")} leading={<Copy className="h-3.5 w-3.5" />}>Duplicate</Btn>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="mt-5">
              <TabsList className="flex w-full flex-wrap gap-1 bg-muted/60 p-1 h-auto">
                <TabsTrigger value="overview" className="text-[11px]">Overview</TabsTrigger>
                <TabsTrigger value="pricing" className="text-[11px]">Pricing</TabsTrigger>
                <TabsTrigger value="inventory" className="text-[11px]">Inventory</TabsTrigger>
                <TabsTrigger value="sales" className="text-[11px]">Sales</TabsTrigger>
                <TabsTrigger value="licensing" className="text-[11px]">Licensing</TabsTrigger>
                <TabsTrigger value="activity" className="text-[11px]">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 pt-4">
                <Card className="p-4">
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</h4>
                  <dl className="space-y-2 text-[13px]">
                    <RowKV icon={Tag} label="Category" value={row.category} />
                    <RowKV icon={DollarSign} label="Price" value={`₹${row.price.toLocaleString()}`} />
                    <RowKV icon={Layers} label="Stock" value={String(row.stock)} />
                  </dl>
                </Card>
                {row.description && (
                  <Card className="p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
                    <p className="whitespace-pre-wrap text-[13px]">{row.description}</p>
                  </Card>
                )}
                <Card className="p-4 text-[11px] text-muted-foreground">
                  Created {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Price" value={`₹${row.price.toLocaleString()}`} icon={DollarSign} />
                  <KPI label="Cost" value={`₹${row.cost.toLocaleString()}`} icon={DollarSign} />
                  <KPI label="Margin" value={`${row.price > 0 ? Math.round(((row.price - row.cost) / row.price) * 100) : 0}%`} icon={TrendingUp} />
                </div>
                <EmptyState compact icon={DollarSign} title="No tier pricing" description="Reseller tier pricing and volume discounts will appear here." />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="On Hand" value={row.stock} icon={Layers} />
                  <KPI label="Reserved" value={0} icon={Layers} />
                  <KPI label="Available" value={row.stock} icon={Layers} />
                </div>
                <EmptyState compact icon={Layers} title="No stock movements" description="Stock receipts, adjustments and reservations will appear here." />
              </TabsContent>

              <TabsContent value="sales" className="space-y-3 pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Units Sold" value={0} icon={ShoppingCart} />
                  <KPI label="Revenue" value="₹0" icon={DollarSign} />
                  <KPI label="Resellers" value={0} icon={TrendingUp} />
                </div>
                <EmptyState compact icon={TrendingUp} title="No sales yet" description="Every order line for this product will appear here." />
              </TabsContent>

              <TabsContent value="licensing" className="space-y-3 pt-4">
                <Card className="p-4">
                  <dl className="space-y-2 text-[13px]">
                    <RowKV icon={Tag} label="License Type" value={row.license_type} />
                    <RowKV icon={Tag} label="Billing Cycle" value={row.billing_cycle} />
                    <RowKV icon={Tag} label="Visibility" value={row.visibility} />
                  </dl>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="pt-4">
                <EmptyState compact icon={Layers} title="No activity yet" description="Publishing, edits and price changes will appear here." />
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-6">
              <Btn variant="outline" onClick={() => onAction("delete")}>Delete product</Btn>
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
  open: boolean; onOpenChange: (o: boolean) => void; onCreate: (d: Omit<Product, "id" | "created_at" | "updated_at">) => void;
}) {
  const [f, setF] = useState({
    name: "", sku: "", category: "Software", price: 0, cost: 0, stock: 0,
    license_type: "subscription" as Product["license_type"],
    billing_cycle: "monthly" as Product["billing_cycle"],
    status: "draft" as Product["status"],
    visibility: "public" as Product["visibility"],
    description: "",
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.sku.trim()) return toast.error("Name and SKU are required");
    onCreate(f);
    setF({ name: "", sku: "", category: "Software", price: 0, cost: 0, stock: 0, license_type: "subscription", billing_cycle: "monthly", status: "draft", visibility: "public", description: "" });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New Product</SheetTitle>
          <SheetDescription>Add a product to the reseller catalog.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Product name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Acme Pro Suite" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU"><Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} placeholder="ACM-PRO-01" /></Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (₹)"><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></Field>
            <Field label="Cost (₹)"><Input type="number" value={f.cost} onChange={(e) => setF({ ...f, cost: +e.target.value })} /></Field>
            <Field label="Stock"><Input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: +e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License">
              <Select value={f.license_type} onValueChange={(v) => setF({ ...f, license_type: v as Product["license_type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LICENSES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Billing cycle">
              <Select value={f.billing_cycle} onValueChange={(v) => setF({ ...f, billing_cycle: v as Product["billing_cycle"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CYCLES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Product["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Visibility">
              <Select value={f.visibility} onValueChange={(v) => setF({ ...f, visibility: v as Product["visibility"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <SheetFooter className="gap-2 pt-2">
            <Btn variant="outline" onClick={() => onOpenChange(false)}>Cancel</Btn>
            <Btn type="submit">Create Product</Btn>
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
