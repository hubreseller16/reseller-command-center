import { createFileRoute } from "@tanstack/react-router";
import { MapPinned, Map, Users, Play, Pause, Trash2, Target } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/territories")({
  head: () => ({ meta: [
    { title: "Territories — Reseller Manager" },
    { name: "description", content: "Franchise mapping, region ownership and territory targets." },
    { property: "og:title", content: "Territories — Reseller Manager" },
    { property: "og:description", content: "Franchise mapping, region ownership and territory targets." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const STATUSES = ["active", "unassigned", "on_hold"] as const;
const ZONES = ["north", "south", "east", "west", "central"] as const;

const config: WallConfig = {
  scope: "territories", entity: "territory", route: "/territories",
  eyebrow: "Operations", title: "Territories Wall",
  subtitle: "Franchise mapping, region ownership and monthly territory targets.",
  icon: MapPinned, primaryLabel: "New Territory",
  seed: [],
  columns: [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px] font-semibold">{r.code}</span> },
    { key: "name", header: "Territory", render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "zone", header: "Zone", render: (r) => <StatusPill value={r.zone} /> },
    { key: "state", header: "State" },
    { key: "manager_name", header: "Owner" },
    { key: "monthly_target", header: "Monthly Target", align: "right", sortable: true, render: (r) => inr(r.monthly_target) },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "zone", label: "Zone", options: ZONES },
    { key: "status", label: "Status", options: STATUSES },
  ],
  kpis: [
    { label: "Active", icon: Map, compute: (r) => r.filter((x) => x.status === "active").length },
    { label: "Unassigned", icon: Users, compute: (r) => r.filter((x) => x.status === "unassigned").length },
    { label: "Combined Target", icon: Target, compute: (r) => inr(r.reduce((s, x) => s + Number(x.monthly_target || 0), 0)) },
    { label: "Total", icon: MapPinned, compute: (r) => r.length },
  ],
  bulkActions: [
    { key: "activate", label: "Activate", icon: Play, patch: { status: "active" } },
    { key: "hold", label: "Put On Hold", icon: Pause, patch: { status: "on_hold" } },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "activate", label: "Activate", icon: Play, patch: { status: "active" } },
    { key: "unassign", label: "Unassign Owner", icon: Users, patch: { status: "unassigned", manager_name: "" } },
    { key: "hold", label: "Put On Hold", icon: Pause, patch: { status: "on_hold" }, destructive: true },
  ],
  formFields: [
    { key: "code", label: "Territory Code", type: "text", required: true, placeholder: "TR-001" },
    { key: "name", label: "Territory Name", type: "text", required: true },
    { key: "zone", label: "Zone", type: "select", options: ZONES, defaultValue: "north" },
    { key: "state", label: "State", type: "text" },
    { key: "manager_name", label: "Owner / Franchise", type: "text" },
    { key: "monthly_target", label: "Monthly Target (₹)", type: "number" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "active" },
  ],
  searchFields: ["code", "name", "state", "manager_name"],
  primaryField: "name", subField: "code",
  statusField: "status",
};
