import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Award, BadgeCheck,
  Banknote, Bell, BookCheck, Box, ChevronDown, CircleDollarSign, ClipboardList,
  Clock, Cog, CreditCard, Crown, Download, FileText, Filter, Flag, Gauge,
  Globe2, Headphones, KeyRound, LayoutDashboard, LifeBuoy, LineChart, Mail,
  MapPin, MessageSquare, MoreHorizontal, PackageCheck, PieChart, Plus, Receipt,
  RefreshCcw, Search, Send, Settings2, Shield, ShieldAlert, ShieldCheck, Sparkles,
  Star, Store, Ticket, TrendingDown, TrendingUp, Upload, UserCheck, UserPlus,
  Users, Wallet, XCircle, Zap,
} from "lucide-react";
import {
  ACTION_META, ApprovalInbox, useWorkflow, WorkflowActivityList, WorkflowAuditRows,
  WorkflowProvider, type ActionKind,
} from "@/components/reseller/workflow";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reseller Manager — Software Vala Boss Panel" },
      { name: "description", content: "Enterprise Reseller Manager: KYC, commissions, licenses, wallets, support and analytics." },
    ],
  }),
  component: ResellerManager,
});

/* ─────────────────────────── PRIMITIVES ─────────────────────────── */

function Section({
  id, eyebrow, title, subtitle, action, children,
}: { id?: string; eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>}
          <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  );
}

function Pill({
  tone = "muted", children,
}: { tone?: "muted" | "success" | "warning" | "danger" | "info" | "primary"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground ring-border",
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/15 text-warning-foreground ring-warning/30",
    danger: "bg-destructive/10 text-destructive ring-destructive/20",
    info: "bg-info/10 text-info ring-info/20",
    primary: "bg-primary-soft text-primary ring-primary/20",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${map[tone]}`}>{children}</span>;
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground/80 hover:bg-accent hover:text-accent-foreground">
      {children}
    </button>
  );
}

function Btn({
  variant = "primary", size = "md", className = "", children, onClick, leading,
}: { variant?: "primary" | "ghost" | "outline" | "soft" | "danger"; size?: "sm" | "md"; className?: string; children: React.ReactNode; onClick?: () => void; leading?: React.ReactNode }) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    ghost: "text-foreground/80 hover:bg-accent",
    outline: "border border-border bg-surface hover:bg-accent",
    soft: "bg-primary-soft text-primary hover:bg-primary/15",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-3.5 text-sm" };
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`}>
      {leading}{children}
    </button>
  );
}

/* ─────────────────────────── TOP BAR ─────────────────────────── */

const NAV: { label: string; icon: React.ComponentType<{ className?: string }>; items: { label: string; href: string; desc?: string }[] }[] = [
  { label: "Home", icon: LayoutDashboard, items: [
    { label: "Executive Overview", href: "#overview", desc: "KPIs, alerts, leaderboard" },
    { label: "Quick Actions", href: "#quick-actions", desc: "Approve, broadcast, export" },
    { label: "Activity Timeline", href: "#timeline", desc: "Recent platform activity" },
  ]},
  { label: "Resellers", icon: Users, items: [
    { label: "Directory", href: "#directory", desc: "All resellers, filters & search" },
    { label: "Applications", href: "#applications", desc: "Pending, approved, rejected" },
    { label: "KYC Verification", href: "#kyc", desc: "Identity, business, tax" },
    { label: "Tier Management", href: "#tiers", desc: "Starter → Enterprise" },
    { label: "Territory", href: "#territory", desc: "Country, state, region" },
  ]},
  { label: "Commerce", icon: Store, items: [
    { label: "Subscriptions", href: "#subscriptions" },
    { label: "Licenses", href: "#licenses" },
    { label: "Customers", href: "#customers" },
    { label: "Orders", href: "#orders" },
    { label: "Products", href: "#products" },
    { label: "Leads", href: "#leads" },
  ]},
  { label: "Finance", icon: Banknote, items: [
    { label: "Commission Center", href: "#commissions" },
    { label: "Wallet Center", href: "#wallets" },
    { label: "Payouts", href: "#payouts" },
    { label: "Incentive Program", href: "#incentives" },
    { label: "Tax & Compliance", href: "#compliance" },
  ]},
  { label: "Support", icon: Headphones, items: [
    { label: "Tickets", href: "#support" },
    { label: "Escalations", href: "#support" },
    { label: "SLA Monitor", href: "#support" },
  ]},
  { label: "Analytics", icon: LineChart, items: [
    { label: "Performance", href: "#performance" },
    { label: "Revenue Analytics", href: "#revenue" },
    { label: "Regional Analytics", href: "#revenue" },
    { label: "Growth Analytics", href: "#revenue" },
  ]},
  { label: "Governance", icon: Shield, items: [
    { label: "Activity Timeline", href: "#timeline" },
    { label: "Audit Logs", href: "#audit" },
    { label: "Roles & Permissions", href: "#audit" },
    { label: "Approval Workflow", href: "#audit" },
  ]},
  { label: "Settings", icon: Cog, items: [
    { label: "Reseller Settings", href: "#settings" },
    { label: "Commission Rules", href: "#commissions" },
    { label: "Notification Center", href: "#settings" },
    { label: "API & Integrations", href: "#settings" },
  ]},
];

function TopBar() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gradient-hero)] text-white shadow-sm">
            <Crown className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-tight">Software Vala</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Boss Panel</div>
          </div>
          <span className="ml-2 hidden h-5 items-center rounded bg-primary-soft px-2 text-[10px] font-bold uppercase tracking-wider text-primary lg:inline-flex">Reseller Manager</span>
        </div>

        <nav className="ml-2 hidden flex-1 items-center gap-0.5 xl:flex" onMouseLeave={() => setOpen(null)}>
          {NAV.map((g) => (
            <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)}>
              <button
                onClick={() => setOpen(open === g.label ? null : g.label)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  open === g.label ? "bg-accent text-accent-foreground" : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
                }`}>
                <g.icon className="h-3.5 w-3.5 opacity-70" />
                {g.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {open === g.label && (
                <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-[var(--shadow-elevated)]">
                  {g.items.map((it) => (
                    <a key={it.label} href={it.href} onClick={() => setOpen(null)}
                       className="flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm hover:bg-accent">
                      <span className="font-semibold text-foreground">{it.label}</span>
                      {it.desc && <span className="text-[11px] text-muted-foreground">{it.desc}</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search resellers, IDs, GST, orders…"
              className="h-9 w-72 rounded-md border border-border bg-background pl-8 pr-16 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">⌘K</kbd>
          </div>
          <IconBtn label="Notifications"><Bell className="h-4 w-4" /></IconBtn>
          <IconBtn label="Help"><LifeBuoy className="h-4 w-4" /></IconBtn>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 sm:flex">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">SV</div>
            <div className="leading-tight">
              <div className="text-xs font-bold">Founder</div>
              <div className="text-[10px] text-muted-foreground">Global · Owner</div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── DATA ─────────────────────────── */

const KPIS = [
  { label: "Total Resellers", value: "12,486", delta: "+8.4%", up: true, icon: Users, tone: "primary" as const },
  { label: "Active Resellers", value: "9,742", delta: "+3.1%", up: true, icon: BadgeCheck, tone: "success" as const },
  { label: "Pending Approval", value: "184", delta: "−12", up: false, icon: Clock, tone: "warning" as const },
  { label: "Pending KYC", value: "327", delta: "+18", up: true, icon: ShieldCheck, tone: "info" as const },
  { label: "Monthly Revenue", value: "₹4.82 Cr", delta: "+14.2%", up: true, icon: CircleDollarSign, tone: "success" as const },
  { label: "Monthly Commission", value: "₹62.4 L", delta: "+9.8%", up: true, icon: Banknote, tone: "primary" as const },
  { label: "Pending Payout", value: "₹18.9 L", delta: "92 req", up: false, icon: Wallet, tone: "warning" as const },
  { label: "Wallet Balance", value: "₹1.46 Cr", delta: "stable", up: true, icon: CreditCard, tone: "info" as const },
  { label: "Active Licenses", value: "48,210", delta: "+1,204", up: true, icon: KeyRound, tone: "primary" as const },
  { label: "Renewals (30d)", value: "2,318", delta: "+6.2%", up: true, icon: RefreshCcw, tone: "info" as const },
  { label: "Support Tickets", value: "412", delta: "−3.4%", up: true, icon: Ticket, tone: "warning" as const },
  { label: "Lead Conversion", value: "32.6%", delta: "+1.8 pts", up: true, icon: Gauge, tone: "success" as const },
  { label: "Customers", value: "186,402", delta: "+4.7%", up: true, icon: UserCheck, tone: "primary" as const },
  { label: "Products Sold", value: "92,114", delta: "+11%", up: true, icon: PackageCheck, tone: "success" as const },
  { label: "Top Performers", value: "126", delta: "Diamond", up: true, icon: Crown, tone: "primary" as const },
  { label: "Inactive", value: "2,744", delta: "review", up: false, icon: TrendingDown, tone: "danger" as const },
];

const QUICK = [
  { label: "Add Reseller", icon: UserPlus }, { label: "Approve", icon: BadgeCheck }, { label: "Reject", icon: AlertTriangle },
  { label: "Suspend", icon: Shield }, { label: "Activate", icon: Zap }, { label: "Verify KYC", icon: ShieldCheck },
  { label: "Assign Territory", icon: MapPin }, { label: "Assign Leads", icon: Flag }, { label: "Generate License", icon: KeyRound },
  { label: "Renew License", icon: RefreshCcw }, { label: "Change Plan", icon: Sparkles }, { label: "Reset Password", icon: KeyRound },
  { label: "Export", icon: Download }, { label: "Import", icon: Upload }, { label: "Send Notification", icon: Send },
  { label: "Broadcast", icon: MessageSquare }, { label: "Open Support", icon: Headphones }, { label: "Executive Report", icon: FileText },
];

type Reseller = {
  id: string; company: string; owner: string; email: string; phone: string;
  country: string; city: string; tier: "Starter" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Enterprise";
  status: "Active" | "Pending" | "Suspended" | "Inactive";
  subscription: string; license: string; revenue: string; commission: string; wallet: string;
  customers: number; products: number; orders: number; perf: number; risk: "Low" | "Medium" | "High"; created: string; last: string;
};

const RESELLERS: Reseller[] = [
  { id: "RS-10421", company: "Nimbus Cloud Partners", owner: "Aarav Mehta", email: "aarav@nimbus.io", phone: "+91 98xxx 21042", country: "IN", city: "Mumbai", tier: "Diamond", status: "Active", subscription: "Enterprise · Yearly", license: "L-90421 · 250 seats", revenue: "₹38.4 L", commission: "₹4.8 L", wallet: "₹1.24 L", customers: 412, products: 84, orders: 1208, perf: 96, risk: "Low", created: "12 Mar 2023", last: "2h ago" },
  { id: "RS-10394", company: "Apex Digital Resellers", owner: "Priya Shah", email: "priya@apex.tech", phone: "+91 90xxx 14422", country: "IN", city: "Bengaluru", tier: "Platinum", status: "Active", subscription: "Growth · Yearly", license: "L-90388 · 120 seats", revenue: "₹22.1 L", commission: "₹2.6 L", wallet: "₹84,000", customers: 286, products: 61, orders: 742, perf: 91, risk: "Low", created: "04 Jan 2023", last: "11m ago" },
  { id: "RS-10380", company: "Helix Software Pvt Ltd", owner: "Ritwik Banerjee", email: "rb@helix.in", phone: "+91 99xxx 88010", country: "IN", city: "Kolkata", tier: "Gold", status: "Pending", subscription: "Pro · Monthly", license: "—", revenue: "—", commission: "—", wallet: "₹0", customers: 0, products: 0, orders: 0, perf: 0, risk: "Medium", created: "Today", last: "—" },
  { id: "RS-10355", company: "Stellar IT Networks", owner: "Devansh Rao", email: "devansh@stellar.co", phone: "+1 415 555 0123", country: "US", city: "San Francisco", tier: "Enterprise", status: "Active", subscription: "Enterprise · Yearly", license: "L-90290 · 500 seats", revenue: "$184k", commission: "$22k", wallet: "$3,200", customers: 612, products: 142, orders: 2104, perf: 98, risk: "Low", created: "18 Sep 2022", last: "1h ago" },
  { id: "RS-10331", company: "Quartz Channel Group", owner: "Meera Kapoor", email: "meera@quartz.io", phone: "+44 20 7946 1111", country: "UK", city: "London", tier: "Platinum", status: "Suspended", subscription: "Growth · Yearly", license: "L-90201 · 80 seats (paused)", revenue: "£28k", commission: "£3.4k", wallet: "£420", customers: 198, products: 44, orders: 612, perf: 72, risk: "High", created: "22 Nov 2022", last: "2d ago" },
  { id: "RS-10298", company: "Northwind Reseller Co.", owner: "Yuki Tanaka", email: "yuki@northwind.jp", phone: "+81 3 5555 4422", country: "JP", city: "Tokyo", tier: "Gold", status: "Active", subscription: "Pro · Yearly", license: "L-90188 · 60 seats", revenue: "¥4.2M", commission: "¥520k", wallet: "¥84k", customers: 144, products: 36, orders: 388, perf: 88, risk: "Low", created: "08 Feb 2023", last: "4h ago" },
  { id: "RS-10271", company: "Crestline Distributors", owner: "Omar Haddad", email: "omar@crestline.ae", phone: "+971 4 555 8800", country: "AE", city: "Dubai", tier: "Silver", status: "Active", subscription: "Pro · Monthly", license: "L-90142 · 40 seats", revenue: "AED 88k", commission: "AED 11k", wallet: "AED 1,200", customers: 92, products: 22, orders: 244, perf: 81, risk: "Low", created: "30 Apr 2023", last: "30m ago" },
  { id: "RS-10244", company: "Vector Channel Labs", owner: "Sara Lindgren", email: "sara@vector.se", phone: "+46 8 555 1142", country: "SE", city: "Stockholm", tier: "Starter", status: "Inactive", subscription: "Starter · Monthly", license: "L-90099 · 10 seats", revenue: "—", commission: "—", wallet: "kr 0", customers: 8, products: 6, orders: 11, perf: 41, risk: "Medium", created: "12 May 2023", last: "21d ago" },
];

const TIER_TONE: Record<Reseller["tier"], "muted" | "info" | "primary" | "success" | "warning"> = {
  Starter: "muted", Silver: "muted", Gold: "warning", Platinum: "info", Diamond: "primary", Enterprise: "success",
};
const STATUS_TONE: Record<Reseller["status"], "success" | "warning" | "danger" | "muted"> = {
  Active: "success", Pending: "warning", Suspended: "danger", Inactive: "muted",
};

/* ─────────────────────────── PAGE ─────────────────────────── */

function ResellerManager() {
  return (
    <WorkflowProvider>
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />

        <main className="mx-auto max-w-[1600px] space-y-12 px-4 py-8 lg:px-8">
          <ExecutiveBanner />
          <KPISection />
          <QuickActionsSection />
          <Section id="approvals" eyebrow="Workflow" title="Approval Workflow"
            subtitle="Every sensitive action is routed through this inbox. Approve, reject and audit-trail in one place.">
            <ApprovalInbox />
          </Section>
          <DirectorySection />
          <TwoCol>
            <VerificationQueue />
            <LeadDistribution />
          </TwoCol>
          <TwoCol>
            <CommissionCenter />
            <WalletCenter />
          </TwoCol>
          <TwoCol>
            <SubscriptionCenter />
            <LicenseCenter />
          </TwoCol>
          <SupportCenter />
          <PerformanceAnalytics />
          <RevenueAnalytics />
          <TwoCol>
            <ActivityTimeline />
            <AuditLogs />
          </TwoCol>
          <Footer />
        </main>
      </div>
    </WorkflowProvider>
  );
}


function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>;
}

/* Banner */
function ExecutiveBanner() {
  return (
    <div id="overview" className="relative overflow-hidden rounded-2xl bg-[var(--gradient-hero)] p-6 text-white shadow-[var(--shadow-elevated)] sm:p-8">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" /> Boss Panel · Reseller Command Center
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Manage 12,486 resellers across 47 countries.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            One enterprise dashboard for registration, KYC, licenses, commissions, wallets,
            payouts, support and analytics — built to Salesforce Partner Community grade.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Btn variant="primary" className="bg-white text-primary hover:bg-white/90" leading={<UserPlus className="h-4 w-4" />}>Add Reseller</Btn>
            <Btn variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" leading={<BadgeCheck className="h-4 w-4" />}>Approve Pending (184)</Btn>
            <Btn variant="ghost" className="text-white hover:bg-white/15" leading={<MessageSquare className="h-4 w-4" />}>Broadcast</Btn>
            <Btn variant="ghost" className="text-white hover:bg-white/15" leading={<Download className="h-4 w-4" />}>Executive Report</Btn>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { k: "Global Reach", v: "47", s: "countries", i: Globe2 },
            { k: "GMV (MTD)", v: "₹4.82 Cr", s: "+14.2% MoM", i: TrendingUp },
            { k: "SLA Health", v: "99.4%", s: "support", i: BookCheck },
            { k: "Top Tier", v: "126", s: "Diamond resellers", i: Crown },
          ].map((c) => (
            <div key={c.k} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{c.k}</div>
                <c.i className="h-4 w-4 text-white/80" />
              </div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight">{c.v}</div>
              <div className="text-[11px] text-white/75">{c.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* KPI */
function KPISection() {
  return (
    <Section eyebrow="Real-time" title="Executive KPIs" subtitle="Live operating metrics across the reseller network."
      action={<div className="hidden items-center gap-2 sm:flex"><Btn variant="outline" size="sm" leading={<Filter className="h-3.5 w-3.5" />}>Filters</Btn><Btn variant="outline" size="sm" leading={<RefreshCcw className="h-3.5 w-3.5" />}>Refresh</Btn></div>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${
                k.tone === "success" ? "bg-success/10 text-success" :
                k.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                k.tone === "info" ? "bg-info/10 text-info" :
                k.tone === "danger" ? "bg-destructive/10 text-destructive" :
                "bg-primary-soft text-primary"
              }`}>
                <k.icon className="h-4 w-4" />
              </div>
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{k.delta}
              </span>
            </div>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-0.5 text-xl font-extrabold tracking-tight">{k.value}</div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function QuickActionsSection() {
  return (
    <Section id="quick-actions" eyebrow="One-click" title="Quick Actions" subtitle="Founder-level controls. Every action is audited and notification-wired.">
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
          {QUICK.map((a) => (
            <button key={a.label} className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-xs font-semibold hover:border-primary/40 hover:bg-primary-soft hover:text-primary">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-foreground/70 group-hover:bg-primary group-hover:text-primary-foreground">
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </Section>
  );
}

/* Directory */
function DirectorySection() {
  const [tab, setTab] = useState("All");
  const tabs = ["All", "Active", "Pending", "Suspended", "Inactive", "Diamond", "Enterprise"];
  const rows = useMemo(() => {
    if (tab === "All") return RESELLERS;
    if (["Diamond", "Enterprise"].includes(tab)) return RESELLERS.filter((r) => r.tier === tab);
    return RESELLERS.filter((r) => r.status === tab);
  }, [tab]);

  return (
    <Section id="directory" eyebrow="Network" title="Reseller Directory" subtitle="Search, filter, segment and act on every reseller."
      action={<div className="hidden items-center gap-2 md:flex"><Btn variant="outline" size="sm" leading={<Upload className="h-3.5 w-3.5" />}>Import</Btn><Btn variant="outline" size="sm" leading={<Download className="h-3.5 w-3.5" />}>Export</Btn><Btn size="sm" leading={<UserPlus className="h-3.5 w-3.5" />}>Add Reseller</Btn></div>}>
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search company, owner, ID, GST…" className="h-9 w-64 rounded-md border border-border bg-background pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          {["Country", "Tier", "Status", "Subscription", "Risk", "Created"].map((f) => (
            <button key={f} className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-semibold text-foreground/80 hover:bg-accent">
              {f} <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`h-8 rounded-md px-3 text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold"><input type="checkbox" className="rounded border-border" /></th>
                <th className="px-3 py-3 text-left font-semibold">Reseller</th>
                <th className="px-3 py-3 text-left font-semibold">Tier · Status</th>
                <th className="px-3 py-3 text-left font-semibold">Location</th>
                <th className="px-3 py-3 text-left font-semibold">Subscription · License</th>
                <th className="px-3 py-3 text-right font-semibold">Revenue</th>
                <th className="px-3 py-3 text-right font-semibold">Commission</th>
                <th className="px-3 py-3 text-right font-semibold">Wallet</th>
                <th className="px-3 py-3 text-center font-semibold">Customers</th>
                <th className="px-3 py-3 text-left font-semibold">Performance</th>
                <th className="px-3 py-3 text-left font-semibold">Last Login</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-surface-2/60">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-border" /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-[11px] font-bold text-primary">
                        {r.company.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{r.company}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{r.owner} · {r.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><div className="flex flex-col gap-1"><Pill tone={TIER_TONE[r.tier]}>{r.tier}</Pill><Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill></div></td>
                  <td className="px-3 py-3"><div className="flex items-center gap-1.5 text-xs"><MapPin className="h-3 w-3 text-muted-foreground" />{r.city}, {r.country}</div></td>
                  <td className="px-3 py-3"><div className="text-xs font-semibold">{r.subscription}</div><div className="text-[11px] text-muted-foreground">{r.license}</div></td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{r.revenue}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.commission}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.wallet}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{r.customers}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${r.perf >= 85 ? "bg-success" : r.perf >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${r.perf}%` }} />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums">{r.perf || "—"}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">Risk: {r.risk}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{r.last}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <IconBtn label="View"><Search className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="Edit"><Settings2 className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn label="More"><MoreHorizontal className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div>Showing <span className="font-semibold text-foreground">{rows.length}</span> of <span className="font-semibold text-foreground">12,486</span> resellers</div>
          <div className="flex gap-1">
            <Btn variant="outline" size="sm">Previous</Btn>
            {["1", "2", "3", "…", "624"].map((p, i) => (
              <button key={i} className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${p === "1" ? "bg-primary text-primary-foreground" : "border border-border bg-surface hover:bg-accent"}`}>{p}</button>
            ))}
            <Btn variant="outline" size="sm">Next</Btn>
          </div>
        </div>
      </Card>
    </Section>
  );
}

/* Verification + KYC */
function VerificationQueue() {
  const items = [
    { co: "Helix Software Pvt Ltd", id: "RS-10380", step: "PAN + GST", priority: "High", age: "2h", flag: "Mismatched address" },
    { co: "Brightline Resellers", id: "RS-10412", step: "Company Reg.", priority: "Medium", age: "5h", flag: "Awaiting CIN" },
    { co: "Orbit Channel Inc.", id: "RS-10401", step: "Bank Verification", priority: "Low", age: "1d", flag: "Penny drop pending" },
    { co: "Vector Channel Labs", id: "RS-10244", step: "Re-KYC", priority: "Medium", age: "3d", flag: "Document expired" },
    { co: "Apex Digital Resellers", id: "RS-10394", step: "Director Selfie", priority: "Low", age: "6h", flag: "Liveness pending" },
  ];
  return (
    <Section id="kyc" eyebrow="Compliance" title="Verification Queue" subtitle="KYC, identity, business, tax and bank verification."
      action={<Btn variant="outline" size="sm" leading={<Filter className="h-3.5 w-3.5" />}>Filter</Btn>}>
      <Card>
        <div className="grid grid-cols-3 gap-2 border-b border-border p-3 text-center">
          {[{ l: "Pending", v: "327", t: "warning" }, { l: "In Review", v: "84", t: "info" }, { l: "Approved (7d)", v: "1,209", t: "success" }].map((s) => (
            <div key={s.l} className="rounded-lg bg-surface-2 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-xl font-extrabold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-warning/15 text-warning-foreground"><ShieldCheck className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{i.co} <span className="font-normal text-muted-foreground">· {i.id}</span></div>
                    <div className="truncate text-[11px] text-muted-foreground">{i.step} · {i.flag} · {i.age}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Pill tone={i.priority === "High" ? "danger" : i.priority === "Medium" ? "warning" : "muted"}>{i.priority}</Pill>
                <Btn size="sm" variant="outline">Review</Btn>
                <Btn size="sm">Approve</Btn>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

function LeadDistribution() {
  const sources = [
    { s: "Inbound Web", count: 482, conv: 38 },
    { s: "Partner Referral", count: 311, conv: 52 },
    { s: "Outbound SDR", count: 268, conv: 22 },
    { s: "Marketplace", count: 197, conv: 41 },
    { s: "Events", count: 124, conv: 29 },
  ];
  return (
    <Section id="leads" eyebrow="Pipeline" title="Lead Distribution" subtitle="Incoming, assigned, won & lost — by source and reseller.">
      <Card className="p-5">
        <div className="grid grid-cols-4 gap-3">
          {[{ l: "New", v: "1,382" }, { l: "Assigned", v: "964" }, { l: "Won", v: "412" }, { l: "Lost", v: "188" }].map((s) => (
            <div key={s.l} className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-lg font-extrabold tabular-nums">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {sources.map((s) => (
            <div key={s.s}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold">{s.s}</span>
                <span className="tabular-nums text-muted-foreground">{s.count} leads · <span className="font-semibold text-success">{s.conv}%</span> conv.</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[var(--gradient-hero)]" style={{ width: `${s.conv * 1.6}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  );
}

/* Commission */
function CommissionCenter() {
  const rows = [
    { id: "CMS-44021", reseller: "Nimbus Cloud Partners", plan: "Diamond Override 18%", amount: "₹4,82,400", status: "Approved" },
    { id: "CMS-44017", reseller: "Apex Digital Resellers", plan: "Platinum Tier 14%", amount: "₹2,66,100", status: "Pending" },
    { id: "CMS-44011", reseller: "Stellar IT Networks", plan: "Enterprise 22% + Bonus", amount: "$22,400", status: "Paid" },
    { id: "CMS-44004", reseller: "Crestline Distributors", plan: "Silver 10%", amount: "AED 11,200", status: "Approved" },
    { id: "CMS-43998", reseller: "Quartz Channel Group", plan: "Platinum 14% (Hold)", amount: "£3,420", status: "Rejected" },
  ];
  const tone = (s: string) => s === "Paid" ? "success" : s === "Approved" ? "primary" : s === "Pending" ? "warning" : "danger";
  return (
    <Section id="commissions" eyebrow="Finance" title="Commission Center" subtitle="Rules, pending, approved, paid & overrides."
      action={<Btn size="sm" variant="outline" leading={<Plus className="h-3.5 w-3.5" />}>New Rule</Btn>}>
      <Card>
        <div className="grid grid-cols-3 gap-2 border-b border-border p-3 text-center">
          {[{ l: "Pending", v: "₹14.2 L" }, { l: "Approved", v: "₹38.6 L" }, { l: "Paid (MTD)", v: "₹62.4 L" }].map((s) => (
            <div key={s.l} className="rounded-lg bg-surface-2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div><div className="mt-1 text-lg font-extrabold tabular-nums">{s.v}</div></div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{r.reseller}</div>
                <div className="truncate text-[11px] text-muted-foreground">{r.id} · {r.plan}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular-nums">{r.amount}</span>
                <Pill tone={tone(r.status) as any}>{r.status}</Pill>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

function WalletCenter() {
  const tx = [
    { t: "Credit", who: "Nimbus Cloud Partners", note: "Commission payout", amt: "+₹4,82,400", up: true },
    { t: "Debit", who: "Apex Digital Resellers", note: "License purchase 120 seats", amt: "−₹1,18,000", up: false },
    { t: "Adjustment", who: "Quartz Channel Group", note: "Chargeback resolved", amt: "+£420", up: true },
    { t: "Bonus", who: "Stellar IT Networks", note: "Q-bonus tier achievement", amt: "+$2,200", up: true },
    { t: "Refund", who: "Northwind Reseller Co.", note: "Refund #INV-22841", amt: "−¥84,000", up: false },
  ];
  return (
    <Section id="wallets" eyebrow="Treasury" title="Wallet Center" subtitle="Credits, debits, adjustments, bonuses & refunds.">
      <Card>
        <div className="grid grid-cols-3 gap-2 border-b border-border p-3 text-center">
          {[{ l: "Total Balance", v: "₹1.46 Cr" }, { l: "Hold", v: "₹8.2 L" }, { l: "Available", v: "₹1.38 Cr" }].map((s) => (
            <div key={s.l} className="rounded-lg bg-surface-2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div><div className="mt-1 text-lg font-extrabold tabular-nums">{s.v}</div></div>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {tx.map((t, i) => (
            <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3.5">
              <span className={`grid h-9 w-9 place-items-center rounded-md ${t.up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {t.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{t.who}</div>
                <div className="truncate text-[11px] text-muted-foreground">{t.t} · {t.note}</div>
              </div>
              <div className={`font-bold tabular-nums ${t.up ? "text-success" : "text-destructive"}`}>{t.amt}</div>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

/* Subscription + License */
function SubscriptionCenter() {
  const plans = [
    { p: "Starter", price: "₹1,999/mo", users: 1482, color: "muted" },
    { p: "Pro", price: "₹4,999/mo", users: 3208, color: "info" },
    { p: "Growth", price: "₹14,999/mo", users: 1944, color: "primary" },
    { p: "Enterprise", price: "Custom", users: 612, color: "success" },
  ] as const;
  return (
    <Section id="subscriptions" eyebrow="Plans" title="Subscription Center" subtitle="Plan distribution, renewals & lifecycle.">
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {plans.map((p) => (
            <div key={p.p} className="rounded-lg border border-border bg-surface-2 p-3">
              <Pill tone={p.color as any}>{p.p}</Pill>
              <div className="mt-2 text-lg font-extrabold tabular-nums">{p.users}</div>
              <div className="text-[11px] text-muted-foreground">{p.price}</div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold">Renewal forecast — next 30 days</span><span className="text-muted-foreground">2,318 renewals · ₹3.94 Cr</span></div>
          <div className="grid grid-cols-12 items-end gap-1.5">
            {[42, 58, 70, 64, 88, 92, 76, 84, 96, 72, 90, 80].map((h, i) => (
              <div key={i} className="rounded-t-md bg-[var(--gradient-hero)]" style={{ height: `${h}px` }} />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn size="sm" variant="outline" leading={<RefreshCcw className="h-3.5 w-3.5" />}>Bulk Renew</Btn>
          <Btn size="sm" variant="outline" leading={<TrendingUp className="h-3.5 w-3.5" />}>Bulk Upgrade</Btn>
          <Btn size="sm" variant="ghost" leading={<AlertTriangle className="h-3.5 w-3.5" />}>Cancellations (42)</Btn>
        </div>
      </Card>
    </Section>
  );
}

function LicenseCenter() {
  const lic = [
    { id: "L-90421", reseller: "Nimbus Cloud", seats: 250, used: 214, state: "Active", expiry: "12 Mar 2026" },
    { id: "L-90388", reseller: "Apex Digital", seats: 120, used: 96, state: "Active", expiry: "04 Jan 2026" },
    { id: "L-90290", reseller: "Stellar IT", seats: 500, used: 488, state: "Active", expiry: "18 Sep 2026" },
    { id: "L-90201", reseller: "Quartz Channel", seats: 80, used: 0, state: "Paused", expiry: "—" },
    { id: "L-90188", reseller: "Northwind", seats: 60, used: 41, state: "Renewal Due", expiry: "08 Feb 2026" },
  ];
  return (
    <Section id="licenses" eyebrow="Entitlements" title="License Center" subtitle="Status, seats, binding, devices & renewals.">
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">License</th>
              <th className="px-3 py-2.5 text-left font-semibold">Reseller</th>
              <th className="px-3 py-2.5 text-left font-semibold">Seats</th>
              <th className="px-3 py-2.5 text-left font-semibold">Status</th>
              <th className="px-3 py-2.5 text-left font-semibold">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {lic.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-3 py-3 font-mono text-xs">{l.id}</td>
                <td className="px-3 py-3 text-sm font-semibold">{l.reseller}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(l.used / Math.max(l.seats, 1)) * 100}%` }} /></div>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{l.used}/{l.seats}</span>
                  </div>
                </td>
                <td className="px-3 py-3"><Pill tone={l.state === "Active" ? "success" : l.state === "Paused" ? "muted" : "warning"}>{l.state}</Pill></td>
                <td className="px-3 py-3 text-xs">{l.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* Support */
function SupportCenter() {
  const tickets = [
    { id: "TKT-88421", subject: "License activation failing on 12 devices", reseller: "Nimbus Cloud", chan: "Email", prio: "P1", sla: "01:42", status: "Open" },
    { id: "TKT-88412", subject: "Commission discrepancy — Sept cycle", reseller: "Apex Digital", chan: "Chat", prio: "P2", sla: "06:11", status: "In Progress" },
    { id: "TKT-88401", subject: "GST invoice format request", reseller: "Helix Software", chan: "WhatsApp", prio: "P3", sla: "1d 02h", status: "Pending" },
    { id: "TKT-88392", subject: "Bulk seat upgrade — Enterprise", reseller: "Stellar IT", chan: "Call", prio: "P1", sla: "00:18", status: "Escalated" },
  ];
  const ptone = (p: string) => p === "P1" ? "danger" : p === "P2" ? "warning" : "info";
  const chanIcon: Record<string, React.ComponentType<{ className?: string }>> = { Email: Mail, Chat: MessageSquare, WhatsApp: MessageSquare, Call: Headphones };
  return (
    <Section id="support" eyebrow="Service" title="Support Center" subtitle="Omni-channel tickets, SLA & escalation flow."
      action={<div className="flex gap-2"><Btn size="sm" variant="outline" leading={<Filter className="h-3.5 w-3.5" />}>Filters</Btn><Btn size="sm" leading={<Plus className="h-3.5 w-3.5" />}>New Ticket</Btn></div>}>
      <Card>
        <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
          {[{ l: "Open", v: "184", t: "warning" }, { l: "In Progress", v: "126", t: "info" }, { l: "Escalated", v: "24", t: "danger" }, { l: "Resolved (24h)", v: "412", t: "success" }].map((s) => (
            <div key={s.l} className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
              <span className={`grid h-9 w-9 place-items-center rounded-md ${s.t === "danger" ? "bg-destructive/10 text-destructive" : s.t === "warning" ? "bg-warning/15 text-warning-foreground" : s.t === "info" ? "bg-info/10 text-info" : "bg-success/10 text-success"}`}>
                <Ticket className="h-4 w-4" />
              </span>
              <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div><div className="text-lg font-extrabold tabular-nums">{s.v}</div></div>
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Ticket</th>
              <th className="px-3 py-2.5 text-left font-semibold">Reseller</th>
              <th className="px-3 py-2.5 text-left font-semibold">Channel</th>
              <th className="px-3 py-2.5 text-left font-semibold">Priority</th>
              <th className="px-3 py-2.5 text-left font-semibold">SLA Left</th>
              <th className="px-3 py-2.5 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const Ico = chanIcon[t.chan];
              return (
                <tr key={t.id} className="border-t border-border hover:bg-surface-2/60">
                  <td className="px-3 py-3"><div className="font-semibold">{t.subject}</div><div className="text-[11px] text-muted-foreground">{t.id}</div></td>
                  <td className="px-3 py-3 text-sm">{t.reseller}</td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-xs"><Ico className="h-3.5 w-3.5 text-muted-foreground" />{t.chan}</span></td>
                  <td className="px-3 py-3"><Pill tone={ptone(t.prio) as any}>{t.prio}</Pill></td>
                  <td className="px-3 py-3 text-xs font-semibold tabular-nums">{t.sla}</td>
                  <td className="px-3 py-3"><Pill tone={t.status === "Escalated" ? "danger" : t.status === "Open" ? "warning" : t.status === "Pending" ? "muted" : "info"}>{t.status}</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

/* Performance */
function PerformanceAnalytics() {
  const top = [
    { r: "Stellar IT Networks", tier: "Enterprise", score: 98, growth: "+22%", country: "US" },
    { r: "Nimbus Cloud Partners", tier: "Diamond", score: 96, growth: "+18%", country: "IN" },
    { r: "Apex Digital Resellers", tier: "Platinum", score: 91, growth: "+12%", country: "IN" },
    { r: "Northwind Reseller Co.", tier: "Gold", score: 88, growth: "+9%", country: "JP" },
    { r: "Crestline Distributors", tier: "Silver", score: 81, growth: "+6%", country: "AE" },
  ];
  return (
    <Section id="performance" eyebrow="Excellence" title="Performance Analytics" subtitle="Targets, growth, satisfaction & rank across the network.">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div><div className="text-sm font-bold">Network performance · 12 months</div><div className="text-xs text-muted-foreground">Composite score across 9,742 active resellers</div></div>
            <Pill tone="success">+11.4% YoY</Pill>
          </div>
          <div className="grid grid-cols-12 items-end gap-1.5">
            {[34, 42, 48, 51, 58, 62, 66, 70, 74, 78, 84, 88].map((h, i) => (
              <div key={i} className="rounded-t-md bg-[var(--gradient-hero)]" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => <span key={i}>{m}</span>)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ l: "Avg CSAT", v: "4.72" }, { l: "Retention", v: "94.2%" }, { l: "Target Hit", v: "82%" }, { l: "Avg Growth", v: "+9.6%" }].map((s) => (
              <div key={s.l} className="rounded-lg border border-border bg-surface-2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div><div className="mt-1 text-lg font-extrabold">{s.v}</div></div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-border p-4"><div className="text-sm font-bold">Leaderboard</div><Btn size="sm" variant="ghost">View all</Btn></div>
          <ul className="divide-y divide-border">
            {top.map((t, i) => (
              <li key={t.r} className="flex items-center gap-3 p-3.5">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${i === 0 ? "bg-warning text-warning-foreground" : i === 1 ? "bg-muted text-foreground" : i === 2 ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted-foreground"}`}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.r}</div>
                  <div className="text-[11px] text-muted-foreground">{t.tier} · {t.country}</div>
                </div>
                <Pill tone="success">{t.growth}</Pill>
                <div className="flex items-center gap-1 text-xs font-bold"><Star className="h-3.5 w-3.5 text-warning" />{t.score}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

/* Revenue */
function RevenueAnalytics() {
  const regions = [
    { r: "India", pct: 58, val: "₹2.79 Cr" },
    { r: "USA", pct: 18, val: "$184k" },
    { r: "UAE + GCC", pct: 9, val: "AED 442k" },
    { r: "UK + EU", pct: 8, val: "£128k" },
    { r: "APAC", pct: 7, val: "¥18.2M" },
  ];
  return (
    <Section id="revenue" eyebrow="Insights" title="Revenue Analytics" subtitle="Revenue, commission, regional and growth analytics."
      action={<Btn size="sm" variant="outline" leading={<Download className="h-3.5 w-3.5" />}>Export</Btn>}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div><div className="text-sm font-bold">Revenue vs Commission · 12 months</div><div className="text-xs text-muted-foreground">Stacked monthly performance</div></div>
            <div className="flex items-center gap-3 text-[11px]"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Revenue</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Commission</span></div>
          </div>
          <div className="grid h-56 grid-cols-12 items-end gap-2">
            {[[120, 18], [140, 22], [132, 20], [168, 28], [184, 32], [202, 36], [188, 30], [220, 38], [248, 42], [232, 38], [264, 46], [288, 52]].map(([rev, com], i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-full overflow-hidden rounded-t-md bg-primary" style={{ height: `${rev}px` }} />
                <div className="w-full rounded-b-md bg-success/80" style={{ height: `${com}px` }} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><div className="text-sm font-bold">Regional split</div><Globe2 className="h-4 w-4 text-muted-foreground" /></div>
          <div className="space-y-3">
            {regions.map((r) => (
              <div key={r.r}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold">{r.r}</span><span className="tabular-nums text-muted-foreground">{r.val} · {r.pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--gradient-hero)]" style={{ width: `${r.pct * 1.6}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface-2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">YoY</div><div className="mt-1 inline-flex items-center gap-1 text-lg font-extrabold text-success"><TrendingUp className="h-4 w-4" />+34.8%</div></div>
            <div className="rounded-lg border border-border bg-surface-2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">MoM</div><div className="mt-1 inline-flex items-center gap-1 text-lg font-extrabold text-success"><TrendingUp className="h-4 w-4" />+14.2%</div></div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

/* Activity + Audit */
function ActivityTimeline() {
  const items = [
    { i: BadgeCheck, t: "12 KYC approvals processed", who: "Founder · 14m ago", tone: "success" },
    { i: UserPlus, t: "8 new applications received", who: "System · 32m ago", tone: "info" },
    { i: Banknote, t: "Payout batch #B-4421 released — ₹62.4 L to 412 resellers", who: "Finance · 1h ago", tone: "primary" },
    { i: Shield, t: "Suspended Quartz Channel Group (risk flag)", who: "Compliance · 2h ago", tone: "danger" },
    { i: Sparkles, t: "Diamond tier promotion: Nimbus Cloud Partners", who: "Tier Engine · 3h ago", tone: "primary" },
    { i: MessageSquare, t: "Broadcast sent: Q-end commission cycle", who: "Founder · 5h ago", tone: "info" },
  ];
  return (
    <Section id="timeline" eyebrow="Realtime" title="Activity Timeline" subtitle="Recent platform events across the reseller network.">
      <Card className="p-2">
        <ol className="relative ml-4 border-l border-border">
          {items.map((it, idx) => (
            <li key={idx} className="ml-4 py-3.5">
              <span className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ring-4 ring-card ${
                it.tone === "success" ? "bg-success" : it.tone === "danger" ? "bg-destructive" : it.tone === "primary" ? "bg-primary" : "bg-info"
              }`} />
              <div className="flex items-center gap-2.5">
                <it.i className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold">{it.t}</div>
                  <div className="text-[11px] text-muted-foreground">{it.who}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </Section>
  );
}

function AuditLogs() {
  const logs = [
    { actor: "founder@softwarevala.com", action: "approved.kyc", target: "RS-10394", ip: "10.4.21.18", time: "14:42:08", status: "OK" },
    { actor: "compliance@softwarevala.com", action: "suspended.reseller", target: "RS-10331", ip: "10.4.21.04", time: "13:18:51", status: "OK" },
    { actor: "system.payouts", action: "batch.released", target: "B-4421", ip: "—", time: "12:02:11", status: "OK" },
    { actor: "founder@softwarevala.com", action: "rule.update", target: "commission.tier.diamond", ip: "10.4.21.18", time: "11:48:22", status: "OK" },
    { actor: "system.scoring", action: "tier.promotion", target: "RS-10421", ip: "—", time: "10:31:09", status: "OK" },
    { actor: "ops@softwarevala.com", action: "license.revoked", target: "L-90120", ip: "10.4.21.31", time: "09:12:44", status: "OK" },
  ];
  return (
    <Section id="audit" eyebrow="Governance" title="Audit Logs" subtitle="Immutable record of every privileged action."
      action={<Btn size="sm" variant="outline" leading={<Download className="h-3.5 w-3.5" />}>Export CSV</Btn>}>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Actor</th>
              <th className="px-3 py-2.5 text-left font-semibold">Action</th>
              <th className="px-3 py-2.5 text-left font-semibold">Target</th>
              <th className="px-3 py-2.5 text-left font-semibold">IP</th>
              <th className="px-3 py-2.5 text-left font-semibold">Time</th>
              <th className="px-3 py-2.5 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-t border-border font-mono text-xs">
                <td className="px-3 py-2.5">{l.actor}</td>
                <td className="px-3 py-2.5"><span className="rounded bg-primary-soft px-1.5 py-0.5 font-semibold text-primary">{l.action}</span></td>
                <td className="px-3 py-2.5">{l.target}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{l.ip}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{l.time}</td>
                <td className="px-3 py-2.5"><Pill tone="success">{l.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="mt-6 border-t border-border pt-6 text-xs text-muted-foreground">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--gradient-hero)] text-white"><Crown className="h-3.5 w-3.5" /></div>
            <div className="font-bold text-foreground">Software Vala · Boss Panel</div>
          </div>
          <p className="mt-2 max-w-xs">Enterprise reseller command center. Inspired by Salesforce Partner Community, Microsoft Partner Center, Zoho Partner Portal, WHMCS & HubSpot — built on the Software Vala Design System.</p>
        </div>
        <div><div className="mb-2 font-semibold text-foreground">Reseller</div><ul className="space-y-1"><li>Directory</li><li>Applications</li><li>KYC</li><li>Tiers & Territory</li></ul></div>
        <div><div className="mb-2 font-semibold text-foreground">Finance</div><ul className="space-y-1"><li>Commissions</li><li>Wallets</li><li>Payouts</li><li>Compliance</li></ul></div>
        <div><div className="mb-2 font-semibold text-foreground">Platform</div><ul className="space-y-1"><li>API & Webhooks</li><li>Notification Center</li><li>Audit Logs</li><li>Settings</li></ul></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>© 2026 Software Vala. All actions audited.</div>
        <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><Activity className="h-3 w-3 text-success" /> All systems normal</span><span>v2.4 · Boss Panel</span></div>
      </div>
    </footer>
  );
}
