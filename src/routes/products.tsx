import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingCart, TrendingUp, Archive } from "lucide-react";
import { WallScaffold } from "@/components/wall/Scaffold";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — Reseller Manager" }, { name: "description", content: "Manage every product offered to resellers." }] }),
  component: () => (
    <WallScaffold
      eyebrow="Catalog" title="Product Management Wall"
      subtitle="Create, price, version and publish every product in the reseller catalog."
      kpis={[
        { label: "Total Products", icon: Package },
        { label: "Active SKUs", icon: ShoppingCart, hint: "Available to resellers" },
        { label: "Drafts", icon: Archive, hint: "Not published" },
        { label: "Best Sellers", icon: TrendingUp, hint: "Last 30 days" },
      ]}
      primaryAction="New Product" icon={Package}
      description="Add your first product to start offering it to resellers. Pricing, license type, billing cycle and visibility are all controlled here."
    />
  ),
});
