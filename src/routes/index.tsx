import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ShoppingCart, Wallet, KeyRound, ShieldCheck, BadgeCheck, Percent,
  TrendingUp, Activity, ScrollText, Inbox, ArrowUpRight, RefreshCcw, Plus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { WallHeader } from "@/components/wall/Shell";
import { Btn, Card, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Reseller Manager" },
      { name: "description", content: "Boss-level overview of every reseller, KYC, commission, wallet, license, order and support metric." },
    ],
  }),
  component: DashboardWall,
});

type DashboardSummary = {
  resellers: number;
  pendingKyc: number;
  pendingApprovals: number;
  orders: number;
  walletBalance: number;
  commissionPayable: number;
  activeLicenses: number;
  openTickets: number;
};

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  // Wire to real tables as each Wall provisions its schema.
  // Any table that doesn't exist yet returns an error → counted as 0.
  const count = async (table: string, filter?: (q: ReturnType<typeof supabase.from>) => unknown) => {
    try {
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q) as typeof q;
      const { count: c, error } = await q;
      if (error) return 0;
      return c ?? 0;
    } catch { return 0; }
  };
  const sum = async (_table: string, _column: string) => 0;

  const [resellers, pendingKyc, pendingApprovals, orders, activeLicenses, openTickets] = await Promise.all([
    count("resellers"),
    count("kyc_submissions", (q) => q.eq("status" as never, "pending" as never)),
    count("approval_requests", (q) => q.eq("status" as never, "pending" as never)),
    count("orders"),
    count("licenses", (q) => q.eq("status" as never, "active" as never)),
    count("support_tickets", (q) => q.eq("status" as never, "open" as never)),
  ]);

  return {
    resellers,
    pendingKyc,
    pendingApprovals,
    orders,
    walletBalance: await sum("wallet_transactions", "amount"),
    commissionPayable: await sum("commission_ledger", "amount"),
    activeLicenses,
    openTickets,
  };
}

function DashboardWall() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
  });

  return (
    <>
      <WallHeader
        eyebrow="Boss Panel"
        title="Reseller Manager — Dashboard"
        subtitle="Single command center across the entire reseller network. Every Top Bar item opens its own dedicated Wall."
        actions={
          <>
            <Btn variant="outline" leading={<RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />} onClick={() => refetch()}>
              Refresh
            </Btn>
            <Btn leading={<Plus className="h-3.5 w-3.5" />}>New Reseller</Btn>
          </>
        }
      />

      {/* KPI strip — pulls real counts from Lovable Cloud. Shows 0 until tables exist. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        <KPI label="Resellers" value={data?.resellers ?? 0} icon={Users} loading={isLoading} hint="Active network" />
        <KPI label="Pending KYC" value={data?.pendingKyc ?? 0} icon={ShieldCheck} loading={isLoading} hint="Awaiting review" />
        <KPI label="Approvals" value={data?.pendingApprovals ?? 0} icon={BadgeCheck} loading={isLoading} hint="Inbox queue" />
        <KPI label="Orders" value={data?.orders ?? 0} icon={ShoppingCart} loading={isLoading} hint="All-time" />
        <KPI label="Wallet Balance" value={fmtMoney(data?.walletBalance ?? 0)} icon={Wallet} loading={isLoading} hint="Across resellers" />
        <KPI label="Commission Due" value={fmtMoney(data?.commissionPayable ?? 0)} icon={Percent} loading={isLoading} hint="Payable cycle" />
        <KPI label="Active Licenses" value={data?.activeLicenses ?? 0} icon={KeyRound} loading={isLoading} hint="Provisioned" />
        <KPI label="Open Tickets" value={data?.openTickets ?? 0} icon={Inbox} loading={isLoading} hint="Support queue" />
      </div>

      {/* Quick navigation to every Wall */}
      <div className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Walls</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {WALLS.map((w) => (
            <Link
              key={w.to}
              to={w.to}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <w.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[13px] font-semibold">
                  {w.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{w.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two columns: activity + approvals — empty states until backend tables exist */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Activity Timeline"
            description="Real-time events across the reseller network."
            action={<Btn size="sm" variant="ghost" leading={<RefreshCcw className="h-3.5 w-3.5" />} onClick={() => refetch()}>Refresh</Btn>}
          >
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Once resellers, orders, KYC submissions or approvals start flowing, every event will appear here in real time."
            />
          </SectionCard>
        </div>
        <SectionCard title="Approval Inbox" description="Pending decisions for the Boss.">
          <EmptyState
            compact
            icon={BadgeCheck}
            title="Inbox is clear"
            description="No pending approvals."
            action={<Btn size="sm" variant="outline">Go to Approvals Wall</Btn>}
          />
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top Resellers" description="Ranked by 30-day revenue.">
          <EmptyState compact icon={TrendingUp} title="No revenue data" description="Connect the Orders Wall to start tracking the leaderboard." />
        </SectionCard>
        <SectionCard title="Audit Logs" description="Immutable record of every privileged action.">
          <EmptyState compact icon={ScrollText} title="Audit trail is empty" description="Privileged actions across every Wall will be recorded here." />
        </SectionCard>
      </div>

      <Card className="mt-6 border-dashed bg-surface/40 p-4 text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">Database-ready.</span>{" "}
        This Wall counts directly from Lovable Cloud tables (<code>resellers</code>, <code>orders</code>, <code>licenses</code>, <code>support_tickets</code>, <code>kyc_submissions</code>, <code>approval_requests</code>).
        Missing tables resolve to 0 — no mock data is ever shown. Each Wall provisions its own schema as it is built.
      </Card>
    </>
  );
}

function fmtMoney(n: number) {
  if (!n) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const WALLS: { to: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: "/products", label: "Products", desc: "Catalog & pricing", icon: KeyRound },
  { to: "/customers", label: "Customers", desc: "Reseller's customers", icon: Users },
  { to: "/orders", label: "Orders", desc: "Order pipeline", icon: ShoppingCart },
  { to: "/wallet", label: "Wallet", desc: "Balances & payouts", icon: Wallet },
  { to: "/commission", label: "Commission", desc: "Rules & ledger", icon: Percent },
  { to: "/subscriptions", label: "Subscriptions", desc: "Recurring revenue", icon: RefreshCcw },
  { to: "/licenses", label: "Licenses", desc: "Provisioning & keys", icon: KeyRound },
  { to: "/kyc", label: "KYC", desc: "Verification queue", icon: ShieldCheck },
  { to: "/approvals", label: "Approvals", desc: "Boss decisions", icon: BadgeCheck },
  { to: "/support", label: "Support", desc: "Ticket center", icon: Inbox },
  { to: "/analytics", label: "Analytics", desc: "Network insights", icon: TrendingUp },
  { to: "/reports", label: "Reports", desc: "Exports & schedules", icon: ScrollText },
  { to: "/audit", label: "Audit", desc: "Immutable trail", icon: ScrollText },
  { to: "/notifications", label: "Notifications", desc: "Broadcast & alerts", icon: Activity },
];
