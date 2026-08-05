import { createFileRoute } from "@tanstack/react-router";
import { Building2, Crown, Network, Users, Play, Pause, Ban, Trash2 } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";

export const Route = createFileRoute("/hierarchy")({
  head: () => ({ meta: [
    { title: "Hierarchy — Reseller Manager" },
    { name: "description", content: "Master, regional, standard and associate reseller structure." },
    { property: "og:title", content: "Hierarchy — Reseller Manager" },
    { property: "og:description", content: "Master, regional, standard and associate reseller structure." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const TIERS = ["master", "regional", "standard", "associate"] as const;
const STATUSES = ["active", "inactive", "suspended", "blocked"] as const;

const config: WallConfig = {
  scope: "hierarchy", entity: "node", route: "/hierarchy",
  eyebrow: "Network", title: "Hierarchy Wall",
  subtitle: "Parent-child reseller structure across master, regional, standard and associate tiers.",
  icon: Network, primaryLabel: "New Node",
  seed: [],
  columns: [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px] font-semibold">{r.code}</span> },
    { key: "company_name", header: "Reseller", render: (r) => <div className="font-semibold">{r.company_name}</div> },
    { key: "tier", header: "Tier", render: (r) => <StatusPill value={r.tier} /> },
    { key: "parent_code", header: "Reports To", render: (r) => <span className="font-mono text-[12px]">{r.parent_code || "—"}</span> },
    { key: "child_count", header: "Sub-Resellers", align: "right", sortable: true },
    { key: "region", header: "Region" },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "tier", label: "Tier", options: TIERS },
    { key: "status", label: "Status", options: STATUSES },
  ],
  kpis: [
    { label: "Masters", icon: Crown, compute: (r) => r.filter((x) => x.tier === "master").length },
    { label: "Regional", icon: Building2, compute: (r) => r.filter((x) => x.tier === "regional").length },
    { label: "Associates", icon: Users, compute: (r) => r.filter((x) => x.tier === "associate").length },
    { label: "Total Nodes", icon: Network, compute: (r) => r.length },
  ],
  bulkActions: [
    { key: "activate", label: "Activate", icon: Play, patch: { status: "active" } },
    { key: "suspend", label: "Suspend", icon: Pause, patch: { status: "suspended" }, variant: "destructive", confirmTitle: "Suspend nodes?" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "activate", label: "Activate", icon: Play, patch: { status: "active" } },
    { key: "suspend", label: "Suspend", icon: Pause, patch: { status: "suspended" } },
    { key: "block", label: "Block", icon: Ban, patch: { status: "blocked" }, destructive: true },
  ],
  formFields: [
    { key: "code", label: "Reseller Code", type: "text", required: true, placeholder: "RS-0001" },
    { key: "company_name", label: "Reseller", type: "text", required: true },
    { key: "tier", label: "Tier", type: "select", options: TIERS, required: true, defaultValue: "standard" },
    { key: "parent_code", label: "Reports To (code)", type: "text", placeholder: "RS-0001" },
    { key: "child_count", label: "Sub-Resellers", type: "number", defaultValue: 0 },
    { key: "region", label: "Region", type: "text" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "active" },
  ],
  searchFields: ["code", "company_name", "parent_code", "region"],
  primaryField: "company_name", subField: "code",
  statusField: "status",
};
