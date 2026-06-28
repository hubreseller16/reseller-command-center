import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, BadgeCheck, FileSearch } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/kyc")({
  head: () => ({ meta: [{ title: "KYC — Reseller Manager" }, { name: "description", content: "KYC submissions, verification and compliance." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Compliance" title="KYC Wall"
      subtitle="Review documents, verify identities and maintain a clean compliance posture."
      kpis={[
        { label: "Pending Review", icon: FileSearch },
        { label: "Verified", icon: BadgeCheck },
        { label: "Rejected", icon: ShieldAlert },
        { label: "Re-verification Due", icon: ShieldCheck },
      ]}
      primaryAction="New Submission" icon={ShieldCheck}
      description="KYC submissions land here as resellers upload identity, address and business documents."
    />
  ),
});
