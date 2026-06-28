import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, Globe2 } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Reseller Manager" }, { name: "description", content: "Network insights, cohorts and funnels." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Insights" title="Analytics Wall"
      subtitle="Cohorts, funnels, geo-distribution and tier movement across the entire network."
      kpis={[
        { label: "MRR Growth", icon: TrendingUp },
        { label: "Active Resellers", icon: Users },
        { label: "Tier Promotions", icon: BarChart3 },
        { label: "Geo Coverage", icon: Globe2 },
      ]}
      primaryAction="Build Chart" icon={BarChart3}
      description="Charts and cohorts will populate once orders, customers and subscriptions start flowing through the network."
    />
  ),
});
