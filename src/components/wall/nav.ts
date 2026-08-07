import {
  LayoutDashboard, Package, KeyRound, Repeat, Users, ShieldCheck, BadgeCheck,
  ShoppingCart, Wallet, Percent, BarChart3, FileBarChart, ScrollText, Bell,
  Headphones, Settings, ClipboardCheck, Network, BadgeIndianRupee,
  ChartNoAxesCombined, Goal, Gift, MapPinned, TrendingUp, Keyboard,
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
      { to: "/onboarding", label: "Onboarding", icon: ClipboardCheck },
      { to: "/hierarchy", label: "Hierarchy", icon: Network },
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
      { to: "/payouts", label: "Payouts", icon: BadgeIndianRupee },
      { to: "/earnings", label: "Earnings", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Growth", icon: TrendingUp, items: [
      { to: "/targets", label: "Targets", icon: Goal },
      { to: "/incentives", label: "Incentives", icon: Gift },
      { to: "/territories", label: "Territories", icon: MapPinned },
    ],
  },
  {
    label: "Insights", icon: BarChart3, items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/audit", label: "Audit", icon: ScrollText },
      { to: "/permissions", label: "Permissions", icon: ShieldCheck },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  { to: "/support", label: "Support", icon: Headphones },
  { to: "/help", label: "Help & Shortcuts", icon: Keyboard },
  { to: "/settings", label: "Settings", icon: Settings },

];


export function isGroup(n: WallNavGroup): n is WallNavGroupNode {
  return (n as { items?: WallNavItem[] }).items !== undefined;
}
