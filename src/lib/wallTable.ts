import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Optional database binding for a Wall.
 * `columns` lists the table columns a Wall row may write (everything else is
 * treated as UI-only state and stripped before the request).
 */
export type WallSync = { table: string; columns: string[] };

/* eslint-disable @typescript-eslint/no-explicit-any */

const client = () => supabase as any;

function pick(sync: WallSync, data: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const key of sync.columns) {
    if (data[key] !== undefined && data[key] !== "") out[key] = data[key];
  }
  return out;
}

function fail(scope: string, error: { message: string } | null) {
  if (!error) return false;
  toast.error(`${scope} failed`, { description: error.message });
  return true;
}

export async function syncList(sync: WallSync): Promise<any[] | null> {
  const { data, error } = await client()
    .from(sync.table)
    .select("*")
    .order("created_at", { ascending: false });
  if (fail("Loading records", error)) return null;
  return data ?? [];
}

export async function syncInsert(sync: WallSync, row: Record<string, any>): Promise<any | null> {
  const { data, error } = await client().from(sync.table).insert(pick(sync, row)).select().single();
  if (fail("Save", error)) return null;
  return data;
}

export async function syncInsertMany(sync: WallSync, rows: Record<string, any>[]): Promise<any[] | null> {
  const { data, error } = await client().from(sync.table).insert(rows.map((r) => pick(sync, r))).select();
  if (fail("Import", error)) return null;
  return data ?? [];
}

export async function syncUpdate(sync: WallSync, id: string, patch: Record<string, any>): Promise<any | null> {
  const { data, error } = await client().from(sync.table).update(pick(sync, patch)).eq("id", id).select().single();
  if (fail("Update", error)) return null;
  return data;
}

export async function syncUpdateMany(sync: WallSync, ids: string[], patch: Record<string, any>): Promise<boolean> {
  const { error } = await client().from(sync.table).update(pick(sync, patch)).in("id", ids);
  return !fail("Bulk update", error);
}

export async function syncDelete(sync: WallSync, ids: string[]): Promise<boolean> {
  const { error } = await client().from(sync.table).delete().in("id", ids);
  return !fail("Delete", error);
}
