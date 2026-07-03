import { useEffect, useSyncExternalStore } from "react";

/* ---------- shared cross-wall record index + jump-to-drawer ---------- */

export type SearchEntry = {
  scope: string;               // "orders" | "customers" | "products" | "resellers"
  id: string;                  // record id
  label: string;               // primary line (e.g. order number / name)
  sub?: string;                // secondary line (e.g. customer, sku)
  route: string;               // route to jump to
  hay?: string;                // extra keywords for matching
};

type Pending = { scope: string; id: string } | null;

const state = {
  entries: [] as SearchEntry[],
  pending: null as Pending,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function setScopeEntries(scope: string, entries: SearchEntry[]) {
  const kept = state.entries.filter((e) => e.scope !== scope);
  state.entries = [...kept, ...entries];
  emit();
}

export function clearScopeEntries(scope: string) {
  state.entries = state.entries.filter((e) => e.scope !== scope);
  emit();
}

export function requestOpen(scope: string, id: string) {
  state.pending = { scope, id };
  emit();
}

export function consumePendingOpen(scope: string): string | null {
  if (state.pending?.scope !== scope) return null;
  const id = state.pending.id;
  state.pending = null;
  emit();
  return id;
}

/* ---------- hooks ---------- */

export function useSearchEntries(): SearchEntry[] {
  return useSyncExternalStore(subscribe, () => state.entries, () => state.entries);
}

export function usePendingScope(scope: string): Pending {
  return useSyncExternalStore(
    subscribe,
    () => (state.pending?.scope === scope ? state.pending : null),
    () => null,
  );
}

/** Wall calls this to publish its rows so global search can find them. */
export function useRegisterSearchScope(scope: string, entries: SearchEntry[]) {
  useEffect(() => {
    setScopeEntries(scope, entries);
    return () => clearScopeEntries(scope);
  }, [scope, entries]);
}
