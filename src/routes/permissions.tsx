import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck, UserCog, UserMinus, Trash2, Users } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";

export const Route = createFileRoute("/permissions")({
  head: () => ({ meta: [
    { title: "Permissions — Reseller Manager" },
    { name: "description", content: "Role boundaries for admins, managers, staff and resellers." },
    { property: "og:title", content: "Permissions — Reseller Manager" },
    { property: "og:description", content: "Role boundaries for admins, managers, staff and resellers." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const ROLES = ["admin", "manager", "staff", "viewer", "reseller"] as const;
const STATUSES = ["active", "revoked"] as const;

const config: WallConfig = {
  scope: "permissions", entity: "assignment", route: "/permissions",
  eyebrow: "Governance", title: "Permissions Wall",
  subtitle: "Who can do what — role assignments and access boundaries across the network.",
  icon: ShieldCheck, primaryLabel: "Assign Role",
  seed: [],
  columns: [
    { key: "member", header: "Member", render: (r) => <div className="font-semibold">{r.member}</div> },
    { key: "email", header: "Email", render: (r) => <span className="font-mono text-[12px]">{r.email}</span> },
    { key: "role", header: "Role", render: (r) => <StatusPill value={r.role} /> },
    { key: "scope", header: "Scope", render: (r) => <span className="text-muted-foreground">{r.scope || "Global"}</span> },
    { key: "granted_at", header: "Granted" },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "role", label: "Role", options: ROLES },
    { key: "status", label: "Status", options: STATUSES },
  ],
  kpis: [
    { label: "Admins", icon: KeyRound, compute: (r) => r.filter((x) => x.role === "admin" && x.status === "active").length },
    { label: "Managers", icon: UserCog, compute: (r) => r.filter((x) => x.role === "manager" && x.status === "active").length },
    { label: "Active Grants", icon: Users, compute: (r) => r.filter((x) => x.status === "active").length },
    { label: "Revoked", icon: UserMinus, compute: (r) => r.filter((x) => x.status === "revoked").length },
  ],
  bulkActions: [
    { key: "revoke", label: "Revoke", icon: UserMinus, patch: { status: "revoked" }, variant: "destructive", confirmTitle: "Revoke access?", confirmDescription: "Selected members lose the assigned role immediately." },
    { key: "restore", label: "Restore", icon: ShieldCheck, patch: { status: "active" } },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "restore", label: "Restore Access", icon: ShieldCheck, patch: { status: "active" } },
    { key: "revoke", label: "Revoke Access", icon: UserMinus, patch: { status: "revoked" }, destructive: true },
  ],
  formFields: [
    { key: "member", label: "Member Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "role", label: "Role", type: "select", options: ROLES, required: true, defaultValue: "staff" },
    { key: "scope", label: "Scope", type: "text", placeholder: "Global, or a territory / reseller code" },
    { key: "granted_at", label: "Granted On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "active" },
  ],
  searchFields: ["member", "email", "role", "scope"],
  primaryField: "member", subField: "email",
  statusField: "status",
};
