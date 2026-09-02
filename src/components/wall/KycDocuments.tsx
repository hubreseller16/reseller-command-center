import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileDropzone, type Attachment } from "@/components/wall/FileDropzone";
import { StatusPill } from "@/components/wall/StatusPill";
import { recordAction } from "@/lib/recordAction";

const BUCKET = "kyc-documents";
const MAX_BYTES = 10 * 1024 * 1024;

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = () => supabase as any;

type DocRow = {
  id: string; file_name: string; file_size: number; storage_path: string;
  status: string; doc_type: string; created_at: string;
};

const toAttachment = (d: DocRow): Attachment => ({
  id: d.id,
  name: d.file_name,
  size: Number(d.file_size ?? 0),
  status: (d.status === "verified" || d.status === "rejected" ? d.status : "uploaded") as Attachment["status"],
  progress: 100,
  path: d.storage_path,
  docType: d.doc_type,
  createdAt: d.created_at,
});

/**
 * KYC document panel: real drag & drop uploads to storage, persisted document
 * records, signed preview/download links, verification status and reviewer notes.
 */
export function KycDocuments({
  recordId, status, reviewer, submittedAt, docType = "other",
}: {
  recordId: string;
  status?: string;
  reviewer?: string;
  submittedAt?: string;
  docType?: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [reviewerName, setReviewerName] = useState(reviewer ?? "");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db()
      .from("kyc_documents")
      .select("*")
      .eq("record_key", recordId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load documents", { description: error.message });
    setFiles((data ?? []).map(toAttachment));
    setLoading(false);
  }, [recordId]);

  useEffect(() => {
    setNote(""); setPending([]); setReviewerName(reviewer ?? "");
    void load();
  }, [load, reviewer]);

  const upload = async (list: File[]) => {
    const accepted = list.filter((f) => {
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is larger than 10 MB`); return false; }
      return true;
    });
    if (!accepted.length) return;

    const placeholders: Attachment[] = accepted.map((f) => ({
      id: crypto.randomUUID(), name: f.name, size: f.size, status: "uploading", progress: 15,
    }));
    setPending(placeholders);

    for (let i = 0; i < accepted.length; i += 1) {
      const file = accepted[i]!;
      const ph = placeholders[i]!;
      const path = `${recordId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      setPending((p) => p.map((x) => (x.id === ph.id ? { ...x, progress: 55 } : x)));

      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type || undefined,
      });
      if (up.error) {
        toast.error(`Upload failed · ${file.name}`, { description: up.error.message });
        setPending((p) => p.filter((x) => x.id !== ph.id));
        continue;
      }

      setPending((p) => p.map((x) => (x.id === ph.id ? { ...x, progress: 85 } : x)));
      const { data, error } = await db().from("kyc_documents").insert({
        record_key: recordId,
        doc_type: docType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        storage_path: path,
        status: "uploaded",
        reviewer: reviewerName || null,
      }).select().single();

      setPending((p) => p.filter((x) => x.id !== ph.id));
      if (error || !data) {
        toast.error(`Could not save ${file.name}`, { description: error?.message });
        await supabase.storage.from(BUCKET).remove([path]);
        continue;
      }
      setFiles((p) => [toAttachment(data as DocRow), ...p]);
      void recordAction({
        action: "kyc.document_upload", entityType: "kyc_document", entityId: (data as DocRow).id,
        summary: `Uploaded KYC document "${file.name}"`, after: { record_key: recordId, file_name: file.name },
      });
    }
    toast.success("Documents uploaded");
  };

  const signedUrl = async (file: Attachment) => {
    if (!file.path) return null;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 300);
    if (error || !data) { toast.error("Could not open document", { description: error?.message }); return null; }
    return data.signedUrl;
  };

  const preview = async (file: Attachment) => {
    const url = await signedUrl(file);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const download = async (file: Attachment) => {
    if (!file.path) return;
    const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
    if (error || !data) { toast.error("Download failed", { description: error?.message }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  };

  const setDocStatus = async (file: Attachment, next: "verified" | "rejected") => {
    const prev = files;
    setFiles((p) => p.map((f) => (f.id === file.id ? { ...f, status: next } : f)));
    const { error } = await db().from("kyc_documents")
      .update({ status: next, reviewer: reviewerName || null }).eq("id", file.id);
    if (error) { setFiles(prev); toast.error("Update failed", { description: error.message }); return; }
    void recordAction({
      action: `kyc.document_${next}`, entityType: "kyc_document", entityId: file.id,
      summary: `${next === "verified" ? "Verified" : "Rejected"} KYC document "${file.name}"`,
    });
    toast.success(next === "verified" ? "Document verified" : "Document rejected");
  };

  const remove = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;
    const prev = files;
    setFiles((p) => p.filter((f) => f.id !== id));
    if (file.path) await supabase.storage.from(BUCKET).remove([file.path]);
    const { error } = await db().from("kyc_documents").delete().eq("id", id);
    if (error) { setFiles(prev); toast.error("Delete failed", { description: error.message }); return; }
    void recordAction({
      action: "kyc.document_delete", entityType: "kyc_document", entityId: id,
      summary: `Removed KYC document "${file.name}"`, before: { file_name: file.name },
    });
    toast.success("Document removed");
  };

  const saveReview = async () => {
    if (!note.trim() && !reviewerName.trim()) { toast.error("Add a reviewer or a note first."); return; }
    if (!files.length) { toast.error("Attach a document before saving a review."); return; }
    setSaving(true);
    const { error } = await db().from("kyc_documents")
      .update({ reviewer: reviewerName || null, review_note: note || null })
      .eq("record_key", recordId);
    setSaving(false);
    if (error) { toast.error("Could not save review", { description: error.message }); return; }
    void recordAction({
      action: "kyc.review_note", entityType: "kyc", entityId: recordId,
      summary: `Saved KYC review note for ${recordId}`, after: { reviewer: reviewerName, note },
    });
    toast.success("Review saved.");
  };

  const shown = [...pending, ...files];

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</h4>
          {status ? <StatusPill value={status} /> : null}
        </div>
        <FileDropzone
          files={shown}
          onFilesAdded={(added) => { if (added.length) void upload(added); }}
          onRemove={(id) => void remove(id)}
          onPreview={(f) => void preview(f)}
          onDownload={(f) => void download(f)}
          onVerify={(f) => void setDocStatus(f, "verified")}
          onReject={(f) => void setDocStatus(f, "rejected")}
        />
        {loading ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading documents…
          </p>
        ) : shown.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">No documents attached yet.</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reviewer</h4>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-muted-foreground">Assigned reviewer</dt>
            <dd>
              <input
                aria-label="Assigned reviewer"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Unassigned"
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </dd>
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
            disabled={saving}
            onClick={() => void saveReview()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Save review
          </button>
          <span className="text-[11px] text-muted-foreground">Notes are stored with every document in this submission.</span>
        </div>
      </section>
    </div>
  );
}
