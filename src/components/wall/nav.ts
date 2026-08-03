import {
  LayoutDashboard, Package, KeyRound, Repeat, Users, ShieldCheck, BadgeCheck,
  ShoppingCart, Wallet, Percent, BarChart3, FileBarChart, ScrollText, Bell,
  Headphones, Settings,
} from "lucide-react";

export type WallNavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
export type WallNavGroupNode = { label: string; icon: React.ComponentType<{ className?: string }>; items: WallNavItem[] };
export type WallNavGroup = WallNavGroupNode | WallNavItem;

export const NAV: WallNavGroup[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Catalog", icon: Package, items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/licenses", label: "Licenses", icon: KeyRound },
      { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
    ],
  },
  {
    label: "People", icon: Users, items: [
      { to: "/resellers", label: "Resellers", icon: Users },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/kyc", label: "KYC", icon: ShieldCheck },
      { to: "/approvals", label: "Approvals", icon: BadgeCheck },
    ],
  },
  {
    label: "Commerce", icon: ShoppingCart, items: [
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/wallet", label: "Wallet", icon: Wallet },
      { to: "/commission", label: "Commission", icon: Percent },
    ],
  },
  {
    label: "Insights", icon: BarChart3, items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/audit", label: "Audit", icon: ScrollText },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  { to: "/support", label: "Support", icon: Headphones },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function isGroup(n: WallNavGroup): n is WallNavGroupNode {
  return (n as { items?: WallNavItem[] }).items !== undefined;
}
