import { createFileRoute } from "@tanstack/react-router";
import { Settings, Users, Key, Palette } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Reseller Manager" }, { name: "description", content: "Workspace, team, API and branding settings." }] }),
  component: () => (
    <WallScaffold
      eyebrow="System" title="Settings Wall"
      subtitle="Workspace, team & roles, API keys, webhooks, branding and platform preferences."
      kpis={[
        { label: "Team Members", icon: Users },
        { label: "API Keys", icon: Key },
        { label: "Webhooks", icon: Settings },
        { label: "Brand Themes", icon: Palette },
      ]}
      primaryAction="Invite Member" icon={Settings}
      description="Configure workspace identity, team access, API integrations and platform-wide preferences here."
    />
  ),
});
