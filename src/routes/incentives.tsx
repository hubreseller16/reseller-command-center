import { createFileRoute } from "@tanstack/react-router";
import { Gift, Play, Pause, CheckCircle2, Trash2, Sparkles } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/incentives")({
  head: () => ({ meta: [
    { title: "Incentives — Reseller Manager" },
    { name: "description", content: "Performance incentive programs and reseller progress tracking." },
    { property: "og:title", content: "Incentives — Reseller Manager" },
    { property: "og:description", content: "Performance incentive programs and reseller progress tracking." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const TYPES = ["bonus", "slab", "milestone", "contest"] as const;
const STATUSES = ["draft", "running", "paused", "closed"] as const;

const config: WallConfig = {
  scope: "incentives", entity: "incentive", route: "/incentives",
  eyebrow: "Growth", title: "Incentives Wall",
  subtitle: "Bonus slabs, milestones and contests that drive reseller performance.",
  icon: Gift, primaryLabel: "New Incentive",
  seed: [],
  columns: [
    { key: "name", header: "Program", render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "incentive_type", header: "Type", render: (r) => <StatusPill value={r.incentive_type} /> },
    { key: "value", header: "Reward", align: "right", sortable: true, render: (r) => inr(r.value) },
    { key: "eligibility", header: "Eligibility" },
    { key: "starts_at", header: "Starts" },
    { key: "ends_at", header: "Ends" },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "incentive_type", label: "Type", options: TYPES },
    { key: "status", label: "Status", options: STATUSES },
  ],
  kpis: [
    { label: "Running", icon: Play, compute: (r) => r.filter((x) => x.status === "running").length },
    { label: "Reward Pool", icon: Sparkles, compute: (r) => inr(r.reduce((s, x) => s + Number(x.value || 0), 0)) },
    { label: "Closed", icon: CheckCircle2, compute: (r) => r.filter((x) => x.status === "closed").length },
    { label: "Total Programs", icon: Gift, compute: (r) => r.length },
  ],
  bulkActions: [
    { key: "launch", label: "Launch", icon: Play, patch: { status: "running" } },
    { key: "pause", label: "Pause", icon: Pause, patch: { status: "paused" } },
    { key: "close", label: "Close", icon: CheckCircle2, patch: { status: "closed" }, confirmTitle: "Close incentive programs?" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "launch", label: "Launch", icon: Play, patch: { status: "running" } },
    { key: "pause", label: "Pause", icon: Pause, patch: { status: "paused" } },
    { key: "close", label: "Close", icon: CheckCircle2, patch: { status: "closed" }, destructive: true },
  ],
  formFields: [
    { key: "name", label: "Program Name", type: "text", required: true },
    { key: "incentive_type", label: "Type", type: "select", options: TYPES, defaultValue: "bonus" },
    { key: "value", label: "Reward Value (₹)", type: "number", required: true },
    { key: "eligibility", label: "Eligibility", type: "text", placeholder: "e.g. Regional tier and above" },
    { key: "starts_at", label: "Starts On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "ends_at", label: "Ends On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "draft" },
  ],
  searchFields: ["name", "eligibility", "description"],
  primaryField: "name", subField: "incentive_type",
  statusField: "status",
  renderDetail: (r) => (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Program details</div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] text-foreground/90">
        {r.description || <span className="text-muted-foreground">No description added.</span>}
      </p>
    </>
  ),
};
