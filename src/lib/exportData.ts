/* eslint-disable @typescript-eslint/no-explicit-any */

export type ExportColumn = { key: string; header: string };

const esc = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows: any[], columns: ExportColumn[]): string {
  const head = columns.map((c) => esc(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(","));
  return [head, ...body].join("\n");
}

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(name: string, rows: any[], columns: ExportColumn[]) {
  download(`${name}.csv`, "text/csv", toCSV(rows, columns));
}

/** Excel-compatible export (SpreadsheetML table, opens natively in Excel). */
export function exportExcel(name: string, rows: any[], columns: ExportColumn[]) {
  const h = (v: any) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const table = `<table><thead><tr>${columns.map((c) => `<th>${h(c.header)}</th>`).join("")}</tr></thead><tbody>${
    rows.map((r) => `<tr>${columns.map((c) => `<td>${h(r[c.key])}</td>`).join("")}</tr>`).join("")
  }</tbody></table>`;
  download(
    `${name}.xls`,
    "application/vnd.ms-excel",
    `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>${table}</body></html>`,
  );
}

/** Minimal RFC-4180-ish CSV parser used by the import preview UI. */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); out.push(row); }
  const clean = out.filter((r) => r.some((c) => c.trim() !== ""));
  const headers = clean.shift() ?? [];
  return { headers: headers.map((x) => x.trim()), rows: clean };
}
