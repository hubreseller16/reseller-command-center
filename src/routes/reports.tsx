import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Download, Calendar, FileText } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Reseller Manager" }, { name: "description", content: "Scheduled reports and exports." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Insights" title="Reports Wall"
      subtitle="Scheduled CSV / PDF exports, custom report builder and email delivery to stakeholders."
      kpis={[
        { label: "Saved Reports", icon: FileBarChart },
        { label: "Exports (30d)", icon: Download },
        { label: "Scheduled", icon: Calendar },
        { label: "Templates", icon: FileText },
      ]}
      primaryAction="New Report" icon={FileBarChart}
      description="Build and save reports here. They can be scheduled, exported and emailed automatically."
    />
  ),
});
