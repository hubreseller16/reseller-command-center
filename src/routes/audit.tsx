import { createFileRoute } from "@tanstack/react-router";
import { ScrollText, Shield, AlertTriangle, User } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit — Reseller Manager" }, { name: "description", content: "Immutable audit trail across the platform." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Governance" title="Audit Wall"
      subtitle="Immutable record of every privileged action, with actor, IP, target and outcome."
      kpis={[
        { label: "Events (24h)", icon: ScrollText },
        { label: "Actors", icon: User },
        { label: "Security Events", icon: Shield },
        { label: "Anomalies", icon: AlertTriangle },
      ]}
      primaryAction="Export" icon={ScrollText}
      description="Privileged actions across every Wall will be recorded here in real time, tamper-proof."
    />
  ),
});
