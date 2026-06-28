import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, CheckCircle2, Clock, XCircle } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Reseller Manager" }, { name: "description", content: "Every order across the reseller network." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Commerce" title="Order Management Wall"
      subtitle="The complete order pipeline — from cart to fulfilment to revenue recognition."
      kpis={[
        { label: "Total Orders", icon: ShoppingCart },
        { label: "Completed", icon: CheckCircle2 },
        { label: "Pending", icon: Clock, hint: "Awaiting action" },
        { label: "Cancelled", icon: XCircle },
      ]}
      primaryAction="New Order" icon={ShoppingCart}
      description="Orders placed by resellers will appear here with full lifecycle, invoice and fulfilment tracking."
    />
  ),
});
