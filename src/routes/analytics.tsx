import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp, Users, Globe2, ShoppingCart,
  ArrowUpRight, ArrowDownRight, RefreshCcw, Download,
} from "lucide-react";
import { toast } from "sonner";
import { WallHeader } from "@/components/wall/Shell";
import { Btn, Card, KPI, SectionCard } from "@/components/wall/Empty";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [
    { title: "Analytics — Reseller Manager" },
    { name: "description", content: "Network insights, cohorts and funnels." },
  ] }),
  component: AnalyticsWall,
});

const MRR_TREND = [42, 48, 51, 55, 62, 68, 74, 79, 85, 91, 98, 105];
const ORDER_TREND = [120, 135, 118, 152, 168, 180, 195, 210, 205, 232, 248, 265];
const REGIONS = [
  { name: "North", value: 42, share: 32 },
  { name: "West", value: 38, share: 29 },
  { name: "South", value: 28, share: 22 },
  { name: "East", value: 22, share: 17 },
];
const TOP_RESELLERS = [
  { name: "Acme Digital", tier: "Platinum", revenue: 482000, change: 12.4 },
  { name: "PixelForge", tier: "Gold", revenue: 341000, change: 8.1 },
  { name: "Nova Retail", tier: "Gold", revenue: 288000, change: -3.4 },
  { name: "Bright Retail", tier: "Silver", revenue: 194000, change: 5.7 },
  { name: "OrbitSoft", tier: "Silver", revenue: 152000, change: 2.1 },
];

function AnalyticsWall() {
  return (
    <>
      <WallHeader
        eyebrow="Insights" title="Analytics Wall"
        subtitle="Cohorts, funnels, geo-distribution and tier movement across the entire network."
        actions={
          <>
            <Btn variant="outline" leading={<RefreshCcw className="h-3.5 w-3.5" />} onClick={() => toast.success("Analytics refreshed")}>Refresh</Btn>
            <Btn leading={<Download className="h-3.5 w-3.5" />} onClick={() => toast.success("Export queued")}>Export</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="MRR (₹)" value="₹1.05L" icon={TrendingUp} hint="+11.2% vs last month" />
        <KPI label="Active Resellers" value={130} icon={Users} hint="+6 net new" />
        <KPI label="Orders (30d)" value={265} icon={ShoppingCart} hint="+6.8% MoM" />
        <KPI label="Geo Coverage" value="18 states" icon={Globe2} hint="4 regions" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="MRR Growth" description="Last 12 months, in ₹ thousands">
          <div className="px-5 pb-5 pt-2">
            <Sparkline data={MRR_TREND} accent="emerald" />
            <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> +150% cumulative
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Order Volume" description="Last 12 months, order count">
          <div className="px-5 pb-5 pt-2">
            <Sparkline data={ORDER_TREND} accent="sky" />
            <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-sky-500" /> +121% cumulative
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Regional Split" description="Reseller distribution across India">
          <div className="space-y-3 px-5 py-4">
            {REGIONS.map((r) => (
              <div key={r.name}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">{r.value} resellers · {r.share}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.share * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Top Resellers" description="Ranked by 30-day revenue">
            <div className="divide-y divide-border">
              {TOP_RESELLERS.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.tier} tier</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[13px] font-semibold tabular-nums">₹{r.revenue.toLocaleString("en-IN")}</div>
                      <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${r.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {r.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(r.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <Card className="mt-6 border-dashed bg-surface/40 p-4 text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">Illustrative charts.</span>{" "}
        Once orders, resellers and commissions flow through the network, this Wall computes live cohorts and funnels.
      </Card>
    </>
  );
}

function Sparkline({ data, accent = "primary" }: { data: number[]; accent?: "emerald" | "sky" | "primary" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 32;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const stroke =
    accent === "emerald" ? "stroke-emerald-500" :
    accent === "sky" ? "stroke-sky-500" :
    "stroke-primary";
  const fill =
    accent === "emerald" ? "fill-emerald-500/10" :
    accent === "sky" ? "fill-sky-500/10" :
    "fill-primary/10";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
      <polygon points={`0,${h} ${points} ${w},${h}`} className={fill} />
      <polyline points={points} fill="none" strokeWidth={1.5} className={stroke} />
    </svg>
  );
}
