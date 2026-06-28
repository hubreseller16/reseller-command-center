import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, BadgeCheck, Banknote, Building2, CheckCircle2, ClipboardList,
  Clock, CreditCard, FileText, History, KeyRound, Mail, MapPin, MessageSquare, Phone,
  ReceiptText, Send, ShieldCheck, ShoppingBag, ShieldAlert, UserCheck, Users, Wallet,
  X, XCircle, Zap,
} from "lucide-react";

/* ───────────────────── Types ───────────────────── */

export type ResellerStatus = "Active" | "Pending" | "Suspended" | "Inactive";
export type ResellerLite = {
  id: string; company: string; owner: string; email: string; phone: string;
  country: string; city: string; tier: string;
};

export type ActionKind = "approve" | "reject" | "suspend" | "activate" | "verify_kyc";

export type ApprovalRequest = {
  id: string;
  kind: ActionKind;
  resellerId: string;
  resellerName: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewer?: string;
  reviewedAt?: string;
  reviewNote?: string;
  resultingStatus?: ResellerStatus | "KYC Verified";
};

export type ActivityEntry = {
  id: string; at: string; kind: "info" | "success" | "danger" | "primary" | "warning";
  title: string; meta: string; icon: "approve" | "reject" | "suspend" | "activate" | "verify_kyc" | "submit";
};

export type AuditEntry = {
  id: string; actor: string; action: string; target: string; ip: string; time: string; status: "OK" | "FAIL";
};

/* ───────────────────── Action catalog ───────────────────── */

export const ACTION_META: Record<ActionKind, {
  label: string; verb: string; description: string;
  tone: "success" | "danger" | "warning" | "info" | "primary";
  Icon: React.ComponentType<{ className?: string }>;
  resultStatus?: ResellerStatus | "KYC Verified";
  requireReason: boolean;
}> = {
  approve:    { label: "Approve Reseller", verb: "approved",    description: "Activate the reseller account and grant onboarding access.",  tone: "success", Icon: BadgeCheck,    resultStatus: "Active",       requireReason: false },
  reject:     { label: "Reject Application",verb: "rejected",    description: "Decline the application. The reseller will be notified.",      tone: "danger",  Icon: XCircle,       resultStatus: "Inactive",     requireReason: true  },
  suspend:    { label: "Suspend Reseller",  verb: "suspended",   description: "Freeze account access pending review. Wallets are on hold.",    tone: "warning", Icon: ShieldAlert,   resultStatus: "Suspended",    requireReason: true  },
  activate:   { label: "Activate Reseller", verb: "activated",   description: "Re-enable a suspended/inactive reseller.",                       tone: "primary", Icon: Zap,           resultStatus: "Active",       requireReason: false },
  verify_kyc: { label: "Verify KYC",        verb: "KYC-verified",description: "Mark identity, business and tax verification as complete.",     tone: "info",    Icon: ShieldCheck,   resultStatus: "KYC Verified", requireReason: false },
};

/* ───────────────────── Store ───────────────────── */

type Ctx = {
  approvals: ApprovalRequest[];
  activity: ActivityEntry[];
  audit: AuditEntry[];
  statusOverride: Record<string, ResellerStatus>;
  kycVerified: Record<string, boolean>;

  openDrawer: (r: ResellerLite, status: ResellerStatus) => void;
  closeDrawer: () => void;
  drawerReseller: { r: ResellerLite; status: ResellerStatus } | null;

  openAction: (kind: ActionKind, r: ResellerLite) => void;
  closeAction: () => void;
  pendingAction: { kind: ActionKind; r: ResellerLite } | null;

  submitAction: (kind: ActionKind, r: ResellerLite, reason: string) => void;
  decideApproval: (id: string, decision: "approved" | "rejected", note: string) => void;
  pendingCount: number;
};

const WorkflowCtx = createContext<Ctx | null>(null);
export const useWorkflow = () => {
  const v = useContext(WorkflowCtx);
  if (!v) throw new Error("useWorkflow must be used inside <WorkflowProvider>");
  return v;
};

const now = () => {
  const d = new Date();
  return d.toLocaleString("en-IN", { hour12: false });
};
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const ACTOR = "founder@softwarevala.com";

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    { id: "AP-44210", kind: "approve",    resellerId: "RS-10380", resellerName: "Helix Software Pvt Ltd", reason: "All KYC docs verified by ops.",  requestedBy: "ops@softwarevala.com",       requestedAt: "Today · 11:08", status: "pending" },
    { id: "AP-44204", kind: "verify_kyc", resellerId: "RS-10394", resellerName: "Apex Digital Resellers", reason: "Director selfie + liveness OK.", requestedBy: "compliance@softwarevala.com", requestedAt: "Today · 09:42", status: "pending" },
    { id: "AP-44198", kind: "suspend",    resellerId: "RS-10331", resellerName: "Quartz Channel Group",   reason: "Multiple AML flags · ticket #88401.", requestedBy: "risk@softwarevala.com",   requestedAt: "Yesterday · 18:21", status: "pending" },
  ]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [statusOverride, setStatusOverride] = useState<Record<string, ResellerStatus>>({});
  const [kycVerified, setKycVerified] = useState<Record<string, boolean>>({});
  const [drawerReseller, setDrawerReseller] = useState<Ctx["drawerReseller"]>(null);
  const [pendingAction, setPendingAction] = useState<Ctx["pendingAction"]>(null);

  const log = useCallback((entry: ActivityEntry, audit_: AuditEntry) => {
    setActivity((a) => [entry, ...a]);
    setAudit((a) => [audit_, ...a]);
  }, []);

  const submitAction = useCallback((kind: ActionKind, r: ResellerLite, reason: string) => {
    const meta = ACTION_META[kind];
    const req: ApprovalRequest = {
      id: uid("AP"),
      kind, resellerId: r.id, resellerName: r.company,
      reason: reason || meta.description,
      requestedBy: ACTOR,
      requestedAt: now(),
      status: "pending",
      resultingStatus: meta.resultStatus,
    };
    setApprovals((a) => [req, ...a]);
    log(
      { id: uid("AC"), at: now(), kind: "info", icon: "submit",
        title: `${meta.label} requested for ${r.company}`,
        meta: `${req.id} · awaiting approval` },
      { id: uid("AU"), actor: ACTOR, action: `request.${kind}`, target: r.id, ip: "10.4.21.18", time: now(), status: "OK" },
    );
    setPendingAction(null);
  }, [log]);

  const decideApproval = useCallback((id: string, decision: "approved" | "rejected", note: string) => {
    setApprovals((list) => {
      const next = list.map((a) => a.id === id ? { ...a, status: decision, reviewer: ACTOR, reviewedAt: now(), reviewNote: note } : a);
      const req = list.find((a) => a.id === id);
      if (!req) return next;
      const meta = ACTION_META[req.kind];
      if (decision === "approved") {
        if (meta.resultStatus === "KYC Verified") {
          setKycVerified((k) => ({ ...k, [req.resellerId]: true }));
        } else if (meta.resultStatus) {
          setStatusOverride((s) => ({ ...s, [req.resellerId]: meta.resultStatus as ResellerStatus }));
        }
        log(
          { id: uid("AC"), at: now(), kind: meta.tone === "danger" ? "danger" : meta.tone === "warning" ? "warning" : "success",
            icon: req.kind, title: `${req.resellerName} ${meta.verb}`, meta: `${req.id} · approved by ${ACTOR}` },
          { id: uid("AU"), actor: ACTOR, action: `approved.${req.kind}`, target: req.resellerId, ip: "10.4.21.18", time: now(), status: "OK" },
        );
      } else {
        log(
          { id: uid("AC"), at: now(), kind: "warning", icon: "reject",
            title: `Approval rejected — ${meta.label}`, meta: `${req.id} · ${req.resellerName}` },
          { id: uid("AU"), actor: ACTOR, action: `rejected.request.${req.kind}`, target: req.resellerId, ip: "10.4.21.18", time: now(), status: "OK" },
        );
      }
      return next;
    });
  }, [log]);

  const value: Ctx = {
    approvals, activity, audit, statusOverride, kycVerified,
    drawerReseller, openDrawer: (r, status) => setDrawerReseller({ r, status }), closeDrawer: () => setDrawerReseller(null),
    pendingAction, openAction: (kind, r) => setPendingAction({ kind, r }), closeAction: () => setPendingAction(null),
    submitAction, decideApproval,
    pendingCount: approvals.filter((a) => a.status === "pending").length,
  };

  return (
    <WorkflowCtx.Provider value={value}>
      {children}
      <ActionModal />
      <ResellerDrawer />
    </WorkflowCtx.Provider>
  );
}

/* ───────────────────── Approval Inbox ───────────────────── */

function Pill({ tone, children }: { tone: "muted" | "success" | "warning" | "danger" | "info" | "primary"; children: ReactNode }) {
  const map: Record<string, string> = {
    muted: "bg-muted text-muted-foreground ring-border",
    success: "bg-success/10 text-success ring-success/20",
    warning: "bg-warning/15 text-warning-foreground ring-warning/30",
    danger: "bg-destructive/10 text-destructive ring-destructive/20",
    info: "bg-info/10 text-info ring-info/20",
    primary: "bg-primary-soft text-primary ring-primary/20",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${map[tone]}`}>{children}</span>;
}

export function ApprovalInbox() {
  const { approvals, decideApproval } = useWorkflow();
  const [note, setNote] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const rows = approvals.filter((a) => filter === "all" ? true : a.status === filter);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <div className="text-sm font-bold">Approval Workflow Inbox</div>
          <div className="text-xs text-muted-foreground">
            {approvals.filter((a) => a.status === "pending").length} pending · {approvals.filter((a) => a.status === "approved").length} approved · {approvals.filter((a) => a.status === "rejected").length} rejected
          </div>
        </div>
        <div className="flex gap-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`h-7 rounded-md px-2.5 text-[11px] font-semibold capitalize ${filter === f ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 p-10 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div className="font-semibold text-foreground">Inbox zero</div>
          <div>No {filter !== "all" ? filter : ""} approval requests right now.</div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((a) => {
            const m = ACTION_META[a.kind];
            return (
              <li key={a.id} className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                    m.tone === "success" ? "bg-success/10 text-success" :
                    m.tone === "danger" ? "bg-destructive/10 text-destructive" :
                    m.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                    m.tone === "info" ? "bg-info/10 text-info" : "bg-primary-soft text-primary"
                  }`}>
                    <m.Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{m.label}</span>
                      <span className="text-xs text-muted-foreground">· {a.resellerName} ({a.resellerId})</span>
                      <Pill tone={a.status === "pending" ? "warning" : a.status === "approved" ? "success" : "danger"}>{a.status}</Pill>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{a.id}</span> · requested by {a.requestedBy} · {a.requestedAt}
                    </div>
                    {a.reason && <div className="mt-1.5 rounded-md bg-surface-2 p-2 text-xs text-foreground/80">Reason: {a.reason}</div>}
                    {a.status !== "pending" && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        {a.status === "approved" ? "Approved" : "Rejected"} by {a.reviewer} · {a.reviewedAt}{a.reviewNote ? ` · ${a.reviewNote}` : ""}
                      </div>
                    )}
                  </div>
                  {a.status === "pending" && (
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      <input
                        placeholder="Review note (optional)"
                        value={note[a.id] || ""}
                        onChange={(e) => setNote({ ...note, [a.id]: e.target.value })}
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring/30 sm:w-56"
                      />
                      <button onClick={() => decideApproval(a.id, "rejected", note[a.id] || "")}
                        className="h-8 rounded-md border border-border bg-surface px-3 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive">
                        Reject
                      </button>
                      <button onClick={() => decideApproval(a.id, "approved", note[a.id] || "")}
                        className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────── Activity & Audit feeds ───────────────────── */

const ICONS = { approve: BadgeCheck, reject: XCircle, suspend: ShieldAlert, activate: Zap, verify_kyc: ShieldCheck, submit: Send };

export function useFeeds() {
  const { activity, audit } = useWorkflow();
  return { activity, audit };
}

export function WorkflowActivityList() {
  const { activity } = useWorkflow();
  if (activity.length === 0) return (
    <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
      No workflow activity yet. Trigger an approval, suspend or KYC verification to populate the feed.
    </div>
  );
  return (
    <ol className="relative ml-4 border-l border-border">
      {activity.map((it) => {
        const I = ICONS[it.icon];
        return (
          <li key={it.id} className="ml-4 py-3">
            <span className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ring-4 ring-card ${
              it.kind === "success" ? "bg-success" :
              it.kind === "danger" ? "bg-destructive" :
              it.kind === "warning" ? "bg-warning" :
              it.kind === "primary" ? "bg-primary" : "bg-info"
            }`} />
            <div className="flex items-center gap-2.5">
              <I className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">{it.title}</div>
                <div className="text-[11px] text-muted-foreground">{it.meta} · {it.at}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function WorkflowAuditRows() {
  const { audit } = useWorkflow();
  return (
    <>
      {audit.map((l) => (
        <tr key={l.id} className="border-t border-border bg-primary-soft/20 font-mono text-xs">
          <td className="px-3 py-2.5">{l.actor}</td>
          <td className="px-3 py-2.5"><span className="rounded bg-primary-soft px-1.5 py-0.5 font-semibold text-primary">{l.action}</span></td>
          <td className="px-3 py-2.5">{l.target}</td>
          <td className="px-3 py-2.5 text-muted-foreground">{l.ip}</td>
          <td className="px-3 py-2.5 text-muted-foreground">{l.time}</td>
          <td className="px-3 py-2.5"><Pill tone={l.status === "OK" ? "success" : "danger"}>{l.status}</Pill></td>
        </tr>
      ))}
    </>
  );
}

/* ───────────────────── Action Modal ───────────────────── */

function ActionModal() {
  const { pendingAction, closeAction, submitAction } = useWorkflow();
  const [reason, setReason] = useState("");

  if (!pendingAction) return null;
  const { kind, r } = pendingAction;
  const m = ACTION_META[kind];
  const required = m.requireReason;
  const canSubmit = !required || reason.trim().length >= 6;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => { closeAction(); setReason(""); }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)]">
        <div className="flex items-start gap-3 border-b border-border p-5">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
            m.tone === "success" ? "bg-success/10 text-success" :
            m.tone === "danger" ? "bg-destructive/10 text-destructive" :
            m.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
            m.tone === "info" ? "bg-info/10 text-info" : "bg-primary-soft text-primary"
          }`}>
            <m.Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">{m.label}</div>
            <div className="text-xs text-muted-foreground">{r.company} · {r.id}</div>
          </div>
          <button onClick={() => { closeAction(); setReason(""); }} className="rounded-md p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-foreground/80">{m.description}</p>
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground"><ClipboardList className="h-3.5 w-3.5" /> Approval workflow</div>
            <ol className="mt-2 space-y-1 text-muted-foreground">
              <li>1. Request submitted by <span className="font-semibold text-foreground">{ACTOR}</span></li>
              <li>2. Routed to Approval Inbox for review</li>
              <li>3. On approval: status updates, activity + audit logs recorded, notifications dispatched</li>
            </ol>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">
              Reason / note {required && <span className="text-destructive">*</span>}
            </span>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder={required ? "Minimum 6 characters — required for this action" : "Optional context for the reviewer"}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3">
          <button onClick={() => { closeAction(); setReason(""); }} className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-semibold hover:bg-accent">Cancel</button>
          <button
            disabled={!canSubmit}
            onClick={() => { submitAction(kind, r, reason.trim()); setReason(""); }}
            className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            Submit for approval
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Reseller Drawer ───────────────────── */

type TabKey = "overview" | "kyc" | "wallet" | "commissions" | "licenses" | "customers" | "orders" | "timeline" | "audit" | "approvals";
const TABS: { k: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { k: "overview",    label: "Overview",    icon: Building2 },
  { k: "kyc",         label: "KYC",         icon: ShieldCheck },
  { k: "wallet",      label: "Wallet",      icon: Wallet },
  { k: "commissions", label: "Commissions", icon: Banknote },
  { k: "licenses",    label: "Licenses",    icon: KeyRound },
  { k: "customers",   label: "Customers",   icon: Users },
  { k: "orders",      label: "Orders",      icon: ShoppingBag },
  { k: "timeline",    label: "Timeline",    icon: History },
  { k: "audit",       label: "Audit",       icon: FileText },
  { k: "approvals",   label: "Approvals",   icon: ClipboardList },
];

function ResellerDrawer() {
  const { drawerReseller, closeDrawer, openAction, statusOverride, kycVerified, approvals, activity, audit } = useWorkflow();
  const [tab, setTab] = useState<TabKey>("overview");

  if (!drawerReseller) return null;
  const { r } = drawerReseller;
  const status = statusOverride[r.id] || drawerReseller.status;
  const kyc = kycVerified[r.id];

  const myApprovals = approvals.filter((a) => a.resellerId === r.id);
  const myActivity  = activity.filter((a) => a.title.includes(r.company) || a.meta.includes(r.id));
  const myAudit     = audit.filter((a) => a.target === r.id);

  const action = (kind: ActionKind) => { openAction(kind, r); };

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-card shadow-[var(--shadow-elevated)]">
        {/* Header */}
        <div className="border-b border-border bg-[var(--gradient-hero)] p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-sm font-extrabold ring-1 ring-white/30">
              {r.company.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-extrabold">{r.company}</h3>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{r.tier}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  status === "Active" ? "bg-success/90" : status === "Pending" ? "bg-warning/90 text-warning-foreground" :
                  status === "Suspended" ? "bg-destructive/90" : "bg-white/15"
                }`}>{status}</span>
                {kyc && <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"><ShieldCheck className="h-3 w-3" /> KYC Verified</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-white/85">
                <span className="font-mono">{r.id}</span>
                <span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3" />{r.owner}</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}, {r.country}</span>
              </div>
            </div>
            <button onClick={closeDrawer} className="rounded-md p-1.5 text-white/80 hover:bg-white/15"><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <DrawerBtn onClick={() => action("approve")} icon={BadgeCheck}>Approve</DrawerBtn>
            <DrawerBtn onClick={() => action("reject")}  icon={XCircle}>Reject</DrawerBtn>
            <DrawerBtn onClick={() => action("suspend")} icon={ShieldAlert}>Suspend</DrawerBtn>
            <DrawerBtn onClick={() => action("activate")} icon={Zap}>Activate</DrawerBtn>
            <DrawerBtn onClick={() => action("verify_kyc")} icon={ShieldCheck}>Verify KYC</DrawerBtn>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-border bg-surface-2">
          <div className="flex min-w-max">
            {TABS.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold ${
                  tab === t.k ? "text-primary" : "text-foreground/70 hover:text-foreground"
                }`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
                {t.k === "approvals" && myApprovals.filter((a) => a.status === "pending").length > 0 && (
                  <span className="ml-1 rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">{myApprovals.filter((a) => a.status === "pending").length}</span>
                )}
                {tab === t.k && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && <OverviewTab />}
          {tab === "kyc" && <KycTab verified={!!kyc} />}
          {tab === "wallet" && <WalletTab />}
          {tab === "commissions" && <CommissionsTab />}
          {tab === "licenses" && <LicensesTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "timeline" && (
            myActivity.length === 0
              ? <Empty title="No timeline events yet" hint="Workflow actions on this reseller will appear here." Icon={History} />
              : <ol className="relative ml-3 border-l border-border">
                  {myActivity.map((it) => {
                    const I = ICONS[it.icon];
                    return (
                      <li key={it.id} className="ml-4 py-2.5">
                        <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                        <div className="flex items-center gap-2"><I className="h-3.5 w-3.5 text-muted-foreground" />
                          <div><div className="text-sm font-semibold">{it.title}</div><div className="text-[11px] text-muted-foreground">{it.meta} · {it.at}</div></div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
          )}
          {tab === "audit" && (
            myAudit.length === 0
              ? <Empty title="No audit records yet" hint="Every privileged action on this reseller is recorded here." Icon={FileText} />
              : <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr><th className="px-3 py-2 text-left font-semibold">Actor</th><th className="px-3 py-2 text-left font-semibold">Action</th><th className="px-3 py-2 text-left font-semibold">IP</th><th className="px-3 py-2 text-left font-semibold">Time</th></tr>
                    </thead>
                    <tbody className="font-mono">
                      {myAudit.map((l) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="px-3 py-2">{l.actor}</td>
                          <td className="px-3 py-2"><span className="rounded bg-primary-soft px-1.5 py-0.5 font-semibold text-primary">{l.action}</span></td>
                          <td className="px-3 py-2 text-muted-foreground">{l.ip}</td>
                          <td className="px-3 py-2 text-muted-foreground">{l.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          )}
          {tab === "approvals" && (
            myApprovals.length === 0
              ? <Empty title="No approval requests" hint="Submit an action above to start a workflow." Icon={ClipboardList} />
              : <ul className="space-y-2">
                  {myApprovals.map((a) => {
                    const m = ACTION_META[a.kind];
                    return (
                      <li key={a.id} className="rounded-lg border border-border bg-surface-2 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <m.Icon className="h-4 w-4 text-foreground/70" />
                          <span className="text-sm font-semibold">{m.label}</span>
                          <Pill tone={a.status === "pending" ? "warning" : a.status === "approved" ? "success" : "danger"}>{a.status}</Pill>
                          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{a.id}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">By {a.requestedBy} · {a.requestedAt}</div>
                        {a.reason && <div className="mt-1 text-xs text-foreground/80">“{a.reason}”</div>}
                      </li>
                    );
                  })}
                </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function DrawerBtn({ icon: Icon, onClick, children }: { icon: React.ComponentType<{ className?: string }>; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white/15 px-2.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/25">
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Empty({ title, hint, Icon }: { title: string; hint: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

/* Tab placeholders with representative data */
function StatGrid({ items }: { items: { l: string; v: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.l} className="rounded-lg border border-border bg-surface-2 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.l}</div>
          <div className="mt-1 text-base font-extrabold tabular-nums">{s.v}</div>
        </div>
      ))}
    </div>
  );
}
function OverviewTab() {
  return (
    <div className="space-y-4">
      <StatGrid items={[{ l: "Revenue (MTD)", v: "₹38.4 L" }, { l: "Commission", v: "₹4.8 L" }, { l: "Wallet", v: "₹1.24 L" }, { l: "Performance", v: "96 / 100" }]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Info title="Business" rows={[["GSTIN", "27ABCDE1234F1Z5"], ["PAN", "ABCDE1234F"], ["CIN", "U72200MH2018PTC312000"], ["Plan", "Enterprise · Yearly"]]} />
        <Info title="Account"  rows={[["Owner", "Aarav Mehta"], ["Created", "12 Mar 2023"], ["Last login", "2h ago"], ["Risk score", "Low"]]} />
      </div>
    </div>
  );
}
function Info({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border bg-surface-2 px-3 py-2 text-xs font-bold">{title}</div>
      <dl className="divide-y divide-border">
        {rows.map(([k, v]) => (<div key={k} className="grid grid-cols-2 gap-2 px-3 py-2 text-xs"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
      </dl>
    </div>
  );
}
function KycTab({ verified }: { verified: boolean }) {
  const docs = [
    { name: "PAN Card", status: verified ? "Verified" : "In review" },
    { name: "GST Certificate", status: verified ? "Verified" : "Pending" },
    { name: "Company Incorporation (CIN)", status: verified ? "Verified" : "Pending" },
    { name: "Address Proof (Utility Bill)", status: "Verified" },
    { name: "Director ID + Selfie / Liveness", status: verified ? "Verified" : "In review" },
    { name: "Bank Account (Penny Drop)", status: "Verified" },
  ];
  return (
    <div className="space-y-3">
      <div className={`rounded-lg border p-3 text-sm ${verified ? "border-success/30 bg-success/5 text-success" : "border-warning/30 bg-warning/10 text-warning-foreground"}`}>
        {verified ? "All KYC checks are verified." : "KYC partially verified — review and approve the pending items."}
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {docs.map((d) => (
          <li key={d.name} className="flex items-center justify-between px-3 py-2.5 text-sm">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {d.name}</div>
            <Pill tone={d.status === "Verified" ? "success" : d.status === "Pending" ? "warning" : "info"}>{d.status}</Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}
function WalletTab() {
  const tx = [
    { t: "Credit", n: "Commission payout · Sept cycle", a: "+₹4,82,400" },
    { t: "Debit",  n: "License purchase · 25 seats",   a: "−₹62,500" },
    { t: "Bonus",  n: "Diamond tier quarterly bonus",  a: "+₹1,20,000" },
    { t: "Refund", n: "Refund · INV-22841",            a: "−₹18,000" },
  ];
  return (
    <div className="space-y-4">
      <StatGrid items={[{ l: "Balance", v: "₹1.24 L" }, { l: "Hold", v: "₹12,500" }, { l: "Available", v: "₹1.11 L" }, { l: "Lifetime", v: "₹48.6 L" }]} />
      <ul className="divide-y divide-border rounded-lg border border-border">
        {tx.map((t, i) => (
          <li key={i} className="flex items-center justify-between px-3 py-2.5 text-sm">
            <div><div className="font-semibold">{t.t}</div><div className="text-[11px] text-muted-foreground">{t.n}</div></div>
            <div className={`font-bold tabular-nums ${t.a.startsWith("+") ? "text-success" : "text-destructive"}`}>{t.a}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
function CommissionsTab() {
  const rows = [
    { id: "CMS-44021", plan: "Diamond Override 18%", amt: "₹4,82,400", st: "Paid" },
    { id: "CMS-43988", plan: "Q3 Bonus",             amt: "₹1,20,000", st: "Paid" },
    { id: "CMS-43951", plan: "Diamond Override 18%", amt: "₹4,11,800", st: "Approved" },
    { id: "CMS-43922", plan: "Referral Bonus",       amt: "₹38,000",   st: "Pending" },
  ];
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
          <div><div className="font-semibold">{r.plan}</div><div className="font-mono text-[11px] text-muted-foreground">{r.id}</div></div>
          <div className="flex items-center gap-3"><span className="font-bold tabular-nums">{r.amt}</span><Pill tone={r.st === "Paid" ? "success" : r.st === "Pending" ? "warning" : "primary"}>{r.st}</Pill></div>
        </li>
      ))}
    </ul>
  );
}
function LicensesTab() {
  const lic = [
    { id: "L-90421", plan: "Enterprise · 250 seats", used: 214, expiry: "12 Mar 2026", st: "Active" },
    { id: "L-90388", plan: "Add-on · 50 seats",      used: 38,  expiry: "12 Mar 2026", st: "Active" },
    { id: "L-90120", plan: "Pilot · 10 seats",       used: 0,   expiry: "Revoked",     st: "Revoked" },
  ];
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {lic.map((l) => (
        <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-3 py-3 text-sm">
          <div>
            <div className="font-semibold">{l.plan}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{l.id} · Expires {l.expiry}</div>
          </div>
          <div className="flex items-center gap-2"><span className="text-[11px] tabular-nums text-muted-foreground">{l.used} used</span><Pill tone={l.st === "Active" ? "success" : "danger"}>{l.st}</Pill></div>
        </li>
      ))}
    </ul>
  );
}
function CustomersTab() {
  return <StatGrid items={[{ l: "Total", v: "412" }, { l: "Active", v: "388" }, { l: "Inactive", v: "24" }, { l: "LTV avg", v: "₹62,400" }]} />;
}
function OrdersTab() {
  const rows = [
    { id: "ORD-22841", cust: "Bluewave Pvt Ltd", amt: "₹84,000", st: "Fulfilled" },
    { id: "ORD-22812", cust: "Aster Co.",        amt: "₹2,18,000", st: "Processing" },
    { id: "ORD-22788", cust: "Vertex Studios",   amt: "₹1,44,500", st: "Fulfilled" },
  ];
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
          <div><div className="font-semibold">{r.cust}</div><div className="font-mono text-[11px] text-muted-foreground">{r.id}</div></div>
          <div className="flex items-center gap-3"><span className="font-bold tabular-nums">{r.amt}</span><Pill tone={r.st === "Fulfilled" ? "success" : "info"}>{r.st}</Pill></div>
        </li>
      ))}
    </ul>
  );
}
