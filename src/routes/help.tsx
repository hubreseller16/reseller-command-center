import { createFileRoute } from "@tanstack/react-router";
import { Keyboard, Cookie, Check, X } from "lucide-react";
import { WallHeader } from "@/components/wall/Shell";
import { useCookieConsent } from "@/lib/consent";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Keyboard Shortcuts — Reseller Manager" },
      { name: "description", content: "Keyboard shortcuts for the Reseller Manager sidebar, search and tables, plus cookie preference controls." },
      { property: "og:title", content: "Help & Keyboard Shortcuts — Reseller Manager" },
      { property: "og:description", content: "Learn every Reseller Manager keyboard shortcut and manage your cookie preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpWall,
});

type Shortcut = { keys: string[]; title: string; how: string };

const NAVIGATION: Shortcut[] = [
  {
    keys: ["Ctrl", "B"],
    title: "Collapse / expand the sidebar",
    how: "Press Ctrl + B (⌘ + B on Mac) anywhere in the app. The sidebar shrinks to an icon rail so you keep every Wall one click away while freeing horizontal space. Press it again to expand. You can also use the panel button in the sidebar header, or focus the sidebar rail with Tab and press Enter or Space.",
  },
  {
    keys: ["Ctrl", "K"],
    title: "Open global search",
    how: "Press Ctrl + K (⌘ + K) to open the command palette, type a Wall or record name, move with ↑ / ↓ and press Enter to jump. Escape closes it.",
  },
  {
    keys: ["Tab"],
    title: "Move focus",
    how: "Tab walks through the sidebar links, the rail toggle and the top bar in visual order. Every focused control shows a visible focus ring. Shift + Tab walks backwards.",
  },
  {
    keys: ["Esc"],
    title: "Close the current layer",
    how: "Escape closes search, drawers, dropdowns and clears the current table selection.",
  },
];

const TABLES: Shortcut[] = [
  { keys: ["/"], title: "Focus the Wall search box", how: "Press / on any Wall to jump straight into its search field without touching the mouse." },
  { keys: ["N"], title: "Create a new record", how: "Press N on a Wall to open its create sheet." },
  { keys: ["Enter"], title: "Open the focused row", how: "Tab to a table row and press Enter to open its detail drawer." },
];

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {keys.map((k, i) => (
        <span key={k} className="flex items-center gap-1">
          {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
          <kbd className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] font-semibold text-foreground">
            {k}
          </kbd>
        </span>
      ))}
    </span>
  );
}

function Section({ title, icon: Icon, items }: { title: string; icon: typeof Keyboard; items: Shortcut[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      <ul className="space-y-4">
        {items.map((s) => (
          <li key={s.title} className="flex flex-wrap items-start gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
            <Keys keys={s.keys} />
            <div className="min-w-[14rem] flex-1">
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.how}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CookiePanel() {
  const { consent, setConsent, hydrated } = useCookieConsent();
  const label = !hydrated ? "…" : consent === "accepted" ? "Accepted" : consent === "declined" ? "Declined" : "Not decided yet";

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Cookie className="h-4 w-4 text-primary" /> Cookie preferences
      </h2>
      <p className="text-sm text-muted-foreground">
        Your sidebar collapsed state can be remembered between visits with one small preference
        cookie. Until you accept, the layout is kept in memory for the current session only and no
        cookie is written. Declining removes any cookie already stored.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          Status: {label}
        </span>
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="h-4 w-4" /> Accept cookies
        </button>
        <button
          type="button"
          onClick={() => setConsent("declined")}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" /> Decline
        </button>
      </div>
    </section>
  );
}

function HelpWall() {
  return (
    <div>
      <WallHeader
        eyebrow="Help"
        title="Help & Keyboard Shortcuts"
        subtitle="Every shortcut in the Reseller Manager, how to use it, and control over the cookies that remember your layout."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Navigation & sidebar" icon={Keyboard} items={NAVIGATION} />
        <div className="space-y-5">
          <Section title="Walls & tables" icon={Keyboard} items={TABLES} />
          <CookiePanel />
        </div>
      </div>
    </div>
  );
}
