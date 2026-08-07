import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "@/lib/consent";

/**
 * Consent bar for UI-preference cookies. Until "Accept" is pressed, the
 * sidebar collapsed state lives in memory only (see useSidebarState).
 */
export function CookieConsent() {
  const { consent, setConsent, hydrated } = useCookieConsent();
  if (!hydrated || consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-xl sm:inset-x-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Cookie className="h-4 w-4" />
        </span>
        <p className="min-w-[16rem] flex-1 text-sm text-muted-foreground">
          We can store a single cookie to remember your sidebar layout between visits. Nothing is
          stored until you accept.{" "}
          <Link to="/help" className="font-medium text-foreground underline underline-offset-4">
            Learn more
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setConsent("declined")}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
