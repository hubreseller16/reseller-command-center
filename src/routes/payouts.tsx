import { createFileRoute } from "@tanstack/react-router";
import { BadgeIndianRupee, CheckCircle2, XCircle, PauseCircle, Send, Trash2, Hourglass } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/payouts")({
  head: () => ({ meta: [
    { title: "Payouts — Reseller Manager" },
    { name: "description", content: "Payout requests, holds and release tracking for the reseller network." },
    { property: "og:title", content: "Payouts — Reseller Manager" },
    { property: "og:description", content: "Payout requests, holds and release tracking for the reseller network." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const STATUSES = ["requested", "in_review", "on_hold", "approved", "paid", "rejected"] as const;
const METHODS = ["bank_transfer", "upi", "cheque"] as const;

const config: WallConfig = {
  scope: "payouts", entity: "payout", route: "/payouts",
  eyebrow: "Finance", title: "Payouts Wall",
  subtitle: "Review payout requests and release funds — final financial approval stays with the Super Admin.",
  icon: BadgeIndianRupee, primaryLabel: "New Payout",
  seed: [],
  columns: [
    { key: "payout_number", header: "Payout", render: (r) => <span className="font-mono text-[12px] font-semibold">{r.payout_number}</span> },
    { key: "reseller", header: "Reseller", render: (r) => <div className="font-semibold">{r.reseller}</div> },
    { key: "amount", header: "Amount", align: "right", sortable: true, render: (r) => <span className="font-semibold">{inr(r.amount)}</span> },
    { key: "payment_method", header: "Method", render: (r) => <StatusPill value={r.payment_method} /> },
    { key: "requested_at", header: "Requested" },
    { key: "hold_reason", header: "Hold Reason", render: (r) => <span className="text-muted-foreground">{r.hold_reason || "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "status", label: "Status", options: STATUSES },
    { key: "payment_method", label: "Method", options: METHODS },
  ],
  kpis: [
    { label: "Pending Value", icon: Hourglass, compute: (r) => inr(r.filter((x) => ["requested", "in_review"].includes(x.status)).reduce((s, x) => s + Number(x.amount || 0), 0)) },
    { label: "On Hold", icon: PauseCircle, compute: (r) => r.filter((x) => x.status === "on_hold").length },
    { label: "Paid Value", icon: CheckCircle2, compute: (r) => inr(r.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.amount || 0), 0)) },
    { label: "Total Requests", icon: BadgeIndianRupee, compute: (r) => r.length },
  ],
  bulkActions: [
    { key: "review", label: "Start Review", icon: Send, patch: { status: "in_review" } },
    { key: "approve", label: "Approve", icon: CheckCircle2, patch: { status: "approved" }, confirmTitle: "Approve payouts?", confirmDescription: "Approved payouts move to the settlement queue." },
    { key: "hold", label: "Hold", icon: PauseCircle, patch: { status: "on_hold" } },
    { key: "reject", label: "Reject", icon: XCircle, patch: { status: "rejected" }, variant: "destructive", confirmTitle: "Reject payouts?" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "approve", label: "Approve", icon: CheckCircle2, patch: { status: "approved" } },
    { key: "paid", label: "Mark Paid", icon: Send, patch: { status: "paid" } },
    { key: "hold", label: "Put On Hold", icon: PauseCircle, patch: { status: "on_hold" } },
    { key: "reject", label: "Reject", icon: XCircle, patch: { status: "rejected" }, destructive: true },
  ],
  formFields: [
    { key: "payout_number", label: "Payout No.", type: "text", required: true, placeholder: "PO-0001" },
    { key: "reseller", label: "Reseller", type: "text", required: true },
    { key: "amount", label: "Amount (₹)", type: "number", required: true },
    { key: "payment_method", label: "Method", type: "select", options: METHODS, defaultValue: "bank_transfer" },
    { key: "requested_at", label: "Requested On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "hold_reason", label: "Hold Reason", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "requested" },
  ],
  searchFields: ["payout_number", "reseller", "payment_method"],
  primaryField: "payout_number", subField: "reseller",
  statusField: "status",
};
