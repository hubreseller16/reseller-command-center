import { useRef, useState } from "react";
import { UploadCloud, FileText, Download, Eye, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { StatusPill } from "@/components/wall/StatusPill";

export type Attachment = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "verified" | "rejected";
  progress: number;
  path?: string;
  docType?: string;
  createdAt?: string;
};

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/**
 * Document upload UI (drag & drop, progress, attachment list, preview/download).
 * Storage/persistence is handled by the parent through the callbacks.
 */
export function FileDropzone({
  files, onFilesAdded, onRemove, onPreview, onDownload, onVerify, onReject,
  accept = ".pdf,.png,.jpg,.jpeg", hint, disabled,
}: {
  files: Attachment[];
  onFilesAdded: (files: File[]) => void;
  onRemove: (id: string) => void;
  onPreview?: (file: Attachment) => void;
  onDownload?: (file: Attachment) => void;
  onVerify?: (file: Attachment) => void;
  onReject?: (file: Attachment) => void;
  accept?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents"
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setOver(false);
          if (!disabled) onFilesAdded(Array.from(e.dataTransfer.files));
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${over ? "border-primary bg-primary-soft scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-accent/40"}`}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[13px] font-semibold">Drag &amp; drop documents here</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {hint ?? "PDF, PNG or JPG · up to 10 MB each"} — or <span className="font-semibold text-primary">browse</span>
        </p>
        <input
          ref={inputRef} type="file" accept={accept} multiple className="hidden"
          onChange={(e) => { onFilesAdded(Array.from(e.target.files ?? [])); e.target.value = ""; }}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                {f.status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12px] font-semibold">{f.name}</span>
                  <StatusPill value={f.status === "uploading" ? "processing" : f.status} />
                </div>
                {f.status === "uploading" ? (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${f.progress}%` }} />
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {fmtSize(f.size)} · stored
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onVerify && f.status !== "uploading" && (
                  <IconBtn label="Verify" onClick={() => onVerify(f)}><CheckCircle2 className="h-3.5 w-3.5" /></IconBtn>
                )}
                {onReject && f.status !== "uploading" && (
                  <IconBtn label="Reject" destructive onClick={() => onReject(f)}><XCircle className="h-3.5 w-3.5" /></IconBtn>
                )}
                <IconBtn label="Preview" onClick={() => onPreview?.(f)}><Eye className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn label="Download" onClick={() => (onDownload ?? onPreview)?.(f)}><Download className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn label="Remove" destructive onClick={() => onRemove(f.id)}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, destructive }: { children: React.ReactNode; label: string; onClick?: () => void; destructive?: boolean }) {
  return (
    <button
      type="button" aria-label={label} title={label} onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        destructive ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >{children}</button>
  );
}
