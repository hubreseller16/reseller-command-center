import { createFileRoute } from "@tanstack/react-router";
import { Bell, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Reseller Manager" }, { name: "description", content: "Broadcasts, alerts and notification preferences." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Comms" title="Notifications Wall"
      subtitle="Send broadcasts, manage system alerts and control delivery preferences per channel."
      kpis={[
        { label: "Sent (30d)", icon: Send },
        { label: "Delivered", icon: CheckCircle2 },
        { label: "Failed", icon: AlertCircle },
        { label: "Active Channels", icon: Bell },
      ]}
      primaryAction="New Broadcast" icon={Bell}
      description="Compose broadcasts to the entire network or to a tier-based segment, with email, in-app and SMS channels."
    />
  ),
});
