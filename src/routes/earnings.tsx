import { createFileRoute } from "@tanstack/react-router";
import { ChartNoAxesCombined, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/earnings")({
  head: () => ({ meta: [
    { title: "Earnings — Reseller Manager" },
    { name: "description", content: "Posted and pending earnings ledger across the reseller network." },
    { property: "og:title", content: "Earnings — Reseller Manager" },
    { property: "og:description", content: "Posted and pending earnings ledger across the reseller network." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const TYPES = ["credit", "debit", "adjustment", "reversal"] as const;
const STATUSES = ["pending", "posted", "failed"] as const;

const config: WallConfig = {
  scope: "earnings", entity: "entry", route: "/earnings",
  eyebrow: "Finance", title: "Earnings Wall",
  subtitle: "Immutable ledger of every credit, debit and adjustment posted to reseller wallets.",
  icon: ChartNoAxesCombined, primaryLabel: "New Entry",
  seed: [],
  columns: [
    { key: "reference", header: "Reference", render: (r) => <span className="font-mono text-[12px] font-semibold">{r.reference}</span> },
    { key: "reseller", header: "Reseller", render: (r) => <div className="font-semibold">{r.reseller}</div> },
    { key: "transaction_type", header: "Type", render: (r) => <StatusPill value={r.transaction_type} /> },
    { key: "amount", header: "Amount", align: "right", sortable: true, render: (r) => <span className="font-semibold">{inr(r.amount)}</span> },
    { key: "balance_after", header: "Balance After", align: "right", render: (r) => inr(r.balance_after) },
    { key: "description", header: "Description" },
    { key: "created_at", header: "Posted" },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "transaction_type", label: "Type", options: TYPES },
    { key: "status", label: "Status", options: STATUSES },
  ],
  kpis: [
    { label: "Posted Earnings", icon: CheckCircle2, compute: (r) => inr(r.filter((x) => x.status === "posted" && x.transaction_type === "credit").reduce((s, x) => s + Number(x.amount || 0), 0)) },
    { label: "Pending", icon: Clock, compute: (r) => inr(r.filter((x) => x.status === "pending").reduce((s, x) => s + Number(x.amount || 0), 0)) },
    { label: "Credits", icon: ArrowDownLeft, compute: (r) => r.filter((x) => x.transaction_type === "credit").length },
    { label: "Debits", icon: ArrowUpRight, compute: (r) => r.filter((x) => x.transaction_type === "debit").length },
  ],
  bulkActions: [
    { key: "post", label: "Post", icon: CheckCircle2, patch: { status: "posted" }, confirmTitle: "Post ledger entries?" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "post", label: "Post Entry", icon: CheckCircle2, patch: { status: "posted" } },
    { key: "pending", label: "Mark Pending", icon: Clock, patch: { status: "pending" } },
  ],
  formFields: [
    { key: "reference", label: "Reference", type: "text", required: true, placeholder: "TXN-0001" },
    { key: "reseller", label: "Reseller", type: "text", required: true },
    { key: "transaction_type", label: "Type", type: "select", options: TYPES, defaultValue: "credit" },
    { key: "amount", label: "Amount (₹)", type: "number", required: true },
    { key: "balance_after", label: "Balance After (₹)", type: "number" },
    { key: "description", label: "Description", type: "text" },
    { key: "created_at", label: "Posted On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "pending" },
  ],
  searchFields: ["reference", "reseller", "description"],
  primaryField: "reference", subField: "reseller",
  statusField: "status",
};
