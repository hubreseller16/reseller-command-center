import { createFileRoute } from "@tanstack/react-router";
import { Headphones, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Reseller Manager" }, { name: "description", content: "Support tickets, SLAs and CSAT." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Service" title="Support Wall"
      subtitle="Tickets, SLA breach alerts and CSAT across every reseller channel."
      kpis={[
        { label: "Open Tickets", icon: Clock },
        { label: "Resolved (30d)", icon: CheckCircle2 },
        { label: "SLA Breach", icon: AlertTriangle },
        { label: "CSAT", icon: Headphones },
      ]}
      primaryAction="New Ticket" icon={Headphones}
      description="Support tickets raised by resellers or their customers will appear here with full conversation, SLA and routing."
    />
  ),
});
