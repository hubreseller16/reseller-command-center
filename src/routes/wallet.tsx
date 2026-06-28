import { createFileRoute } from "@tanstack/react-router";
import { Wallet, ArrowUpRight, ArrowDownRight, Banknote } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Reseller Manager" }, { name: "description", content: "Wallet balances, credits, debits and payout history." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Finance" title="Wallet Wall"
      subtitle="Live wallet balances, ledger, top-ups and payouts across every reseller."
      kpis={[
        { label: "Network Balance", icon: Wallet },
        { label: "Credits (30d)", icon: ArrowUpRight },
        { label: "Debits (30d)", icon: ArrowDownRight },
        { label: "Pending Payouts", icon: Banknote },
      ]}
      primaryAction="Process Payout" icon={Wallet}
      description="Wallet entries will appear here once resellers fund their wallet or earn commission."
    />
  ),
});
