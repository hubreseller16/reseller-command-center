import { createFileRoute } from "@tanstack/react-router";
import { Users, UserPlus, UserCheck, Building2 } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Reseller Manager" }, { name: "description", content: "Every customer brought in by every reseller." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Network" title="Customer Management Wall"
      subtitle="Every end-customer owned by every reseller — searchable, segmentable and actionable."
      kpis={[
        { label: "Total Customers", icon: Users },
        { label: "New (30d)", icon: UserPlus },
        { label: "Active", icon: UserCheck, hint: "With live subscription" },
        { label: "Organizations", icon: Building2 },
      ]}
      primaryAction="Add Customer" icon={Users}
      description="Customers will appear here as resellers onboard them or as orders are placed."
    />
  ),
});
