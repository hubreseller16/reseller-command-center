import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type RecordActionInput = {
  action: string;                  // machine code, e.g. "reseller.create"
  entityType: string;              // e.g. "reseller"
  entityId?: string | null;
  summary: string;                 // human readable, e.g. 'Created reseller "Acme"'
  verb?: string;                   // activity verb, defaults to action
  before?: Json | null;
  after?: Json | null;
  notify?: {
    recipientId: string;
    title: string;
    body?: string;
    type?: string;                 // e.g. "info" | "success" | "warning"
    link?: string | null;
  } | null;
};

/**
 * Single funnel for every privileged UI action.
 * Writes (best-effort) to audit_logs + activity_events + notifications.
 *
 * Safe to call without auth — RLS will reject writes and we swallow the error
 * so the UI never breaks. Once auth + roles are wired, every entry lands.
 */
export async function recordAction(input: RecordActionInput): Promise<void> {
  const { action, entityType, entityId = null, summary, verb, before = null, after = null, notify } = input;

  // Fire-and-forget; collect promises so we can settle in parallel.
  const tasks: PromiseLike<unknown>[] = [];

  tasks.push(
    supabase.from("audit_logs").insert({
      action, entity_type: entityType, entity_id: entityId,
      before, after,
    }).then((r) => r),
  );

  tasks.push(
    supabase.from("activity_events").insert({
      verb: verb ?? action, entity_type: entityType, entity_id: entityId,
      summary, metadata: {},
    }).then((r) => r),
  );

  if (notify && notify.recipientId) {
    tasks.push(
      supabase.from("notifications").insert({
        recipient_id: notify.recipientId,
        title: notify.title,
        body: notify.body ?? null,
        type: notify.type ?? "info",
        link: notify.link ?? null,
        entity_type: entityType,
        entity_id: entityId,
        metadata: {},
      }).then((r) => r),
    );
  }

  // Never throw — logging must not break the user action.
  await Promise.allSettled(tasks);
}
