import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Filter } from "lucide-react";
import { WallHeader } from "@/components/wall/Shell";
import { Btn, EmptyState, KPI, SectionCard } from "@/components/wall/Empty";

/**
 * Shared Wall scaffold for not-yet-completed Walls.
 * Renders a full enterprise workspace shell:
 *   - Wall Header with primary actions
 *   - KPI strip (real zeros, no mock data)
 *   - Filter / search toolbar
 *   - Empty-state table region
 *   - Side panel placeholder
 * Each Wall is completed one at a time per the development rule.
 */
export function WallScaffold({
  eyebrow, title, subtitle, kpis, primaryAction = "New", icon, description,
}: {
  eyebrow: string; title: string; subtitle: string;
  kpis: { label: string; hint?: string; icon?: React.ComponentType<{ className?: string }> }[];
  primaryAction?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <>
      <WallHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Btn variant="outline" leading={<Filter className="h-3.5 w-3.5" />}>Filters</Btn>
            <Btn leading={<Plus className="h-3.5 w-3.5" />}>{primaryAction}</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <KPI key={k.label} label={k.label} value={0} hint={k.hint} icon={k.icon} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <SectionCard
          title="Records"
          description="Search, filter and act on every record in this Wall."
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search…"
                className="h-8 w-[240px] rounded-md border border-border bg-surface pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          }
        >
          <EmptyState
            icon={icon}
            title="No records yet"
            description={description}
            action={<Btn leading={<Plus className="h-3.5 w-3.5" />}>{primaryAction}</Btn>}
          />
        </SectionCard>

        <SectionCard title="Detail Panel" description="Selection details appear here.">
          <EmptyState compact icon={icon} title="Nothing selected" description="Pick a row to see its full detail, history and audit log." />
        </SectionCard>
      </div>
    </>
  );
}

// Re-export for stub routes
export function WallStubRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Helper to instantiate a route in one line
export function createWallRoute(_path: string) {
  return createFileRoute(_path as never);
}
