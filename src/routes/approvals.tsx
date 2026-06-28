import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Approvals — Reseller Manager" }, { name: "description", content: "Boss-level approval queue." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Governance" title="Approvals Wall"
      subtitle="Every privileged decision in one inbox — approve, reject or escalate with full audit."
      kpis={[
        { label: "Pending", icon: Clock },
        { label: "Approved (30d)", icon: CheckCircle2 },
        { label: "Rejected (30d)", icon: XCircle },
        { label: "Escalated", icon: BadgeCheck },
      ]}
      primaryAction="New Request" icon={BadgeCheck}
      description="Approval requests will appear here as resellers submit changes that require Boss-level sign-off."
    />
  ),
});
