import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/licenses")({
  head: () => ({ meta: [{ title: "Licenses — Reseller Manager" }, { name: "description", content: "License provisioning, keys and lifecycle." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Catalog" title="License Wall"
      subtitle="Provision, activate, revoke and audit every license issued through the network."
      kpis={[
        { label: "Active Licenses", icon: CheckCircle2 },
        { label: "Issued", icon: KeyRound },
        { label: "Expiring (30d)", icon: AlertTriangle },
        { label: "Revoked", icon: Ban },
      ]}
      primaryAction="Issue License" icon={KeyRound}
      description="License keys appear here as they are provisioned and activated by customers."
    />
  ),
});
