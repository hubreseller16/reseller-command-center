import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, CheckCircle2, XCircle, Search, HelpCircle, Trash2, Hourglass } from "lucide-react";
import { GenericWall, StatusPill, type WallConfig } from "@/components/wall/GenericWall";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Onboarding — Reseller Manager" },
    { name: "description", content: "Reseller application intake, review and activation workflow." },
    { property: "og:title", content: "Onboarding — Reseller Manager" },
    { property: "og:description", content: "Reseller application intake, review and activation workflow." },
  ] }),
  component: () => <GenericWall config={config} />,
});

const STATUSES = ["submitted", "in_review", "needs_information", "approved", "rejected"] as const;
const TYPES = ["master", "regional", "standard", "associate"] as const;

const config: WallConfig = {
  scope: "onboarding", entity: "application", route: "/onboarding",
  eyebrow: "Network", title: "Onboarding Wall",
  subtitle: "Application intake, risk review and activation for every incoming reseller.",
  icon: ClipboardCheck, primaryLabel: "New Application",
  seed: [],
  sync: {
    table: "reseller_applications",
    columns: [
      "application_number", "company_name", "contact_name", "email", "phone",
      "requested_type", "risk_score", "status", "notes", "reviewer",
      "submitted_at", "decided_at",
    ],
  },
  columns: [
    { key: "application_number", header: "Application", render: (r) => <span className="font-mono text-[12px] font-semibold">{r.application_number}</span> },
    { key: "company_name", header: "Company", render: (r) => <div className="font-semibold">{r.company_name}</div> },
    { key: "contact_name", header: "Contact" },
    { key: "requested_type", header: "Requested Tier", render: (r) => <StatusPill value={r.requested_type} /> },
    { key: "risk_score", header: "Risk", align: "right", sortable: true },
    { key: "submitted_at", header: "Submitted" },
    { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
  ],
  filters: [
    { key: "status", label: "Status", options: STATUSES },
    { key: "requested_type", label: "Tier", options: TYPES },
  ],
  kpis: [
    { label: "Awaiting Review", icon: Hourglass, compute: (r) => r.filter((x) => x.status === "submitted").length },
    { label: "In Review", icon: Search, compute: (r) => r.filter((x) => x.status === "in_review").length },
    { label: "Approved", icon: CheckCircle2, compute: (r) => r.filter((x) => x.status === "approved").length },
    { label: "Total", icon: ClipboardCheck, compute: (r) => r.length },
  ],
  bulkActions: [
    { key: "review", label: "Start Review", icon: Search, patch: { status: "in_review" } },
    { key: "approve", label: "Approve", icon: CheckCircle2, patch: { status: "approved" }, confirmTitle: "Approve applications?" },
    { key: "reject", label: "Reject", icon: XCircle, patch: { status: "rejected" }, variant: "destructive", confirmTitle: "Reject applications?" },
    { key: "delete", label: "Delete", icon: Trash2, variant: "destructive" },
  ],
  rowActions: [
    { key: "review", label: "Start Review", icon: Search, patch: { status: "in_review" } },
    { key: "info", label: "Request Information", icon: HelpCircle, patch: { status: "needs_information" } },
    { key: "approve", label: "Approve", icon: CheckCircle2, patch: { status: "approved" } },
    { key: "reject", label: "Reject", icon: XCircle, patch: { status: "rejected" }, destructive: true },
  ],
  formFields: [
    { key: "application_number", label: "Application No.", type: "text", required: true, placeholder: "APP-0001" },
    { key: "company_name", label: "Company Name", type: "text", required: true },
    { key: "contact_name", label: "Contact Person", type: "text", required: true },
    { key: "email", label: "Email", type: "email" },
    { key: "requested_type", label: "Requested Tier", type: "select", options: TYPES, defaultValue: "standard" },
    { key: "risk_score", label: "Risk Score", type: "number", help: "0 (lowest) to 100 (highest)." },
    { key: "submitted_at", label: "Submitted On", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "status", label: "Status", type: "select", options: STATUSES, defaultValue: "submitted" },
    { key: "notes", label: "Review Notes", type: "textarea" },
  ],
  searchFields: ["application_number", "company_name", "contact_name", "email"],
  primaryField: "company_name", subField: "application_number",
  statusField: "status",
};
