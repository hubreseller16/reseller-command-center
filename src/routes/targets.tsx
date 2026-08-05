import { createFileRoute } from "@tanstack/react-router";
import { Goal, TrendingUp, CheckCircle2, Flag, Trash2, RotateCcw } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/targets")({
  head: () => ({ meta: [
    { title: "Targets — Reseller Manager" },
    { name: "description", content: "Revenue, order and customer acquisition goals per reseller period." },
    { property: "og:title", content: "Targets — Reseller Manager" },
    { property: "og:description", content: "Revenue, order and customer acquisition goals per reseller period." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const STATUSES = ["draft", "active", "achieved", "missed"] as const;
const PERIODS = ["monthly", "quarterly", "annual"] as const;

const pct = (r: any) => {
  const t = Number(r.revenue_target || 0);
  return t > 0 ? Math.round((Number(r.achieved_revenue || 0) / t) * 100) : 0;
};

const config: WallConfig = {
  scope: "targets", entity: "target", route: "/targets",
  eyebrow: "Growth", title: "Targets Wall",
  subtitle: "Revenue, order and acquisition goals with live attainment per reseller period.",
  icon: Goal, primaryLabel: "New Target",
  seed: [],
  columns: [
    { key: "reseller", header: "Reseller", render: (r) => <div className="font-semibold">{r.reseller}</div> },
    { key: "period", header: "Period", render: (r) => <StatusPill value={r.period} /> },
    { key: "period_start", header: "Start" },
    { key: "period_end", header: "End" },
    { key: "revenue_target", header: "Revenue Target", align: "right", sortable: true, render: (r) => inr(r.revenue_target) },
    { key: "achieved_revenue", header: "Achieved", align: "right", render: (r) => inr(r.achieved_revenue) },
    {
      key: "attainment", header: "Attainment", align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct(r))}%` }} />
          </div>
          <span className="tabular-nums text-[12px] font-semibold">{pct(r)}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "status", label: "Status", options: STATUSES },
    { key: "period", label: "Period", options: PERIODS },
  ],
  kpis: [
    { label: "Target Value", icon: Goal, compute: (r) => inr(r.reduce((s, x) => s + Number(x.revenue_target || 0), 0)) },
    { label: "Achieved Value", icon: TrendingUp, compute: (r) => inr(r.reduce((s, x) => s + Number(x.achieved_revenue || 0), 0)) },
    { label: "Achieved Goals", icon: CheckCircle2, compute: (r) => r.filter((x) => x.status === "achieved").length },
    { label: "Active Goals", icon: Flag, compute: (r) => r.filter((x) => x.status === "active").length },
  ],
  bulkActions: [
    { key: "activate", label: "Activate", icon: Flag, patch: { status: "active" } },
    { key: "achieved", label: "Mark Achieved", icon: CheckCircle2, patch: { status: "achieved" } },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "activate", label: "Activate", icon: Flag, patch: { status: "active" } },
    { key: "achieved", label: "Mark Achieved", icon: CheckCircle2, patch: { status: "achieved" } },
    { key: "reset", label: "Reset to Draft", icon: RotateCcw, patch: { status: "draft" } },
  ],
  formFields: [
    { key: "reseller", label: "Reseller", type: "text", required: true },
    { key: "period", label: "Period", type: "select", options: PERIODS, defaultValue: "monthly" },
    { key: "period_start", label: "Period Start", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "period_end", label: "Period End", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "revenue_target", label: "Revenue Target (₹)", type: "number", required: true },
    { key: "achieved_revenue", label: "Achieved Revenue (₹)", type: "number", defaultValue: 0 },
    { key: "order_target", label: "Order Target", type: "number" },
    { key: "achieved_orders", label: "Achieved Orders", type: "number", defaultValue: 0 },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "draft" },
  ],
  searchFields: ["reseller", "period"],
  primaryField: "reseller", subField: "period",
  statusField: "status",
};
