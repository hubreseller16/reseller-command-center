import { createFileRoute } from "@tanstack/react-router";
import { Repeat, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Reseller Manager" }, { name: "description", content: "Recurring subscriptions across the network." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Commerce" title="Subscription Wall"
      subtitle="MRR, churn, renewals and dunning — every active subscription in one workspace."
      kpis={[
        { label: "Active Subscriptions", icon: Repeat },
        { label: "Renewals (30d)", icon: CheckCircle2 },
        { label: "Past Due", icon: AlertCircle },
        { label: "Churned (30d)", icon: RotateCcw },
      ]}
      primaryAction="New Subscription" icon={Repeat}
      description="Subscriptions appear here when orders convert into recurring billing."
    />
  ),
});
