import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserCheck } from "lucide-react";
import { FileDropzone, type Attachment } from "@/components/wall/FileDropzone";
import { StatusPill } from "@/components/wall/StatusPill";

/**
 * KYC document panel: drag & drop upload, attachment list with progress,
 * preview/download actions and a reviewer section. Presentation only.
 */
export function KycDocuments({
  recordId, status, reviewer, submittedAt,
}: {
  recordId: string;
  status?: string;
  reviewer?: string;
  submittedAt?: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [note, setNote] = useState("");

  // reset when switching records
  useEffect(() => { setFiles([]); setNote(""); }, [recordId]);

  // simulate upload progress for UI feedback
  useEffect(() => {
    if (!files.some((f) => f.status === "uploading")) return;
    const t = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "uploading") return f;
          const progress = Math.min(100, f.progress + 20);
          return progress >= 100 ? { ...f, progress, status: "uploaded" as const } : { ...f, progress };
        }),
      );
    }, 260);
    return () => clearInterval(t);
  }, [files]);

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</h4>
          {status ? <StatusPill value={status} /> : null}
        </div>
        <FileDropzone
          files={files}
          onFilesAdded={(added) => {
            if (!added.length) return;
            setFiles((prev) => [
              ...prev,
              ...added.map((f) => ({
                id: crypto.randomUUID(),
                name: f.name,
                size: f.size,
                status: "uploading" as const,
                progress: 0,
              })),
            ]);
            toast.success(`${added.length} document${added.length === 1 ? "" : "s"} queued`);
          }}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          onPreview={() => toast.info("Document preview is not available in this environment.")}
        />
        {files.length === 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">No documents attached yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reviewer</h4>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-muted-foreground">Assigned reviewer</dt>
            <dd className="text-[13px] font-semibold">{reviewer || "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Submitted on</dt>
            <dd className="text-[13px] font-semibold">{submittedAt || "—"}</dd>
          </div>
        </dl>
        <label htmlFor={`kyc-note-${recordId}`} className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Review note
        </label>
        <textarea
          id={`kyc-note-${recordId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add a compliance note for this submission…"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { if (!note.trim()) return toast.error("Write a note first."); toast.success("Review note saved."); setNote(""); }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Save note
          </button>
          <span className="text-[11px] text-muted-foreground">Notes are visible to compliance reviewers only.</span>
        </div>
      </section>
    </div>
  );
}
