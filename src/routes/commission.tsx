import { createFileRoute } from "@tanstack/react-router";
import { Percent, FileText, Coins, Calendar } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/commission")({
  head: () => ({ meta: [{ title: "Commission — Reseller Manager" }, { name: "description", content: "Commission rules, ledger and payout cycles." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Finance" title="Commission Wall"
      subtitle="Define rules, track earnings and run payout cycles by tier, product and geography."
      kpis={[
        { label: "Active Rules", icon: FileText },
        { label: "Payable (cycle)", icon: Coins },
        { label: "Paid (YTD)", icon: Percent },
        { label: "Next Payout", icon: Calendar },
      ]}
      primaryAction="New Rule" icon={Percent}
      description="Commission rules and earnings appear here once defined. Tier-based, product-based and override structures are all supported."
    />
  ),
});
