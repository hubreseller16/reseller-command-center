import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, Building2, Bell, ShieldCheck, Palette, Users, Save, Sun, Moon,
} from "lucide-react";
import { WallHeader } from "@/components/wall/Shell";
import { Card, SectionCard } from "@/components/wall/Empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recordAction } from "@/lib/recordAction";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — Reseller Manager" },
    { name: "description", content: "Workspace, notifications, security and appearance settings." },
  ] }),
  component: SettingsWall,
});

function SettingsWall() {
  const [org, setOrg] = useState({
    name: "Software Vala",
    email: "boss@softwarevala.com",
    phone: "+91 98100 00000",
    address: "Mumbai, India",
    website: "https://softwarevala.com",
    tagline: "Reseller Manager Boss Panel",
  });
  const [notif, setNotif] = useState({
    email: true, push: true, digest: false, criticalOnly: false,
  });
  const [security, setSecurity] = useState({
    twoFa: true, sessionTimeout: 30, ipAllowlist: "",
  });
  const [appearance, setAppearance] = useState({
    dark: typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
    density: "comfortable",
  });

  const save = (section: string, payload: unknown) => {
    void recordAction({
      action: `settings.${section}.update`,
      entityType: "settings", entityId: section,
      summary: `Updated ${section} settings`,
      after: payload as Record<string, unknown>,
    });
    toast.success(`${section[0].toUpperCase()}${section.slice(1)} settings saved`);
  };

  return (
    <>
      <WallHeader
        eyebrow="System" title="Settings Wall"
        subtitle="Workspace configuration, notifications, security and appearance — all in one place."
      />

      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="mb-4 h-9">
          <TabsTrigger value="workspace" className="text-[12px]"><Building2 className="mr-1.5 h-3.5 w-3.5" />Workspace</TabsTrigger>
          <TabsTrigger value="notifications" className="text-[12px]"><Bell className="mr-1.5 h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-[12px]"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Security</TabsTrigger>
          <TabsTrigger value="appearance" className="text-[12px]"><Palette className="mr-1.5 h-3.5 w-3.5" />Appearance</TabsTrigger>
          <TabsTrigger value="team" className="text-[12px]"><Users className="mr-1.5 h-3.5 w-3.5" />Team</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <SectionCard title="Workspace" description="Organization identity across every Wall.">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Organization Name" value={org.name} onChange={(v) => setOrg({ ...org, name: v })} />
              <Field label="Contact Email" value={org.email} onChange={(v) => setOrg({ ...org, email: v })} />
              <Field label="Phone" value={org.phone} onChange={(v) => setOrg({ ...org, phone: v })} />
              <Field label="Website" value={org.website} onChange={(v) => setOrg({ ...org, website: v })} />
              <Field label="Address" value={org.address} onChange={(v) => setOrg({ ...org, address: v })} />
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[12px]">Tagline</Label>
                <Textarea rows={2} value={org.tagline} onChange={(e) => setOrg({ ...org, tagline: e.target.value })} />
              </div>
            </div>
            <FooterSave onClick={() => save("workspace", org)} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications">
          <SectionCard title="Notifications" description="Choose what lands in your inbox.">
            <div className="divide-y divide-border">
              <Toggle label="Email notifications" hint="System alerts, approvals, activity summaries." checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
              <Toggle label="Push notifications" hint="Real-time push on desktop and mobile." checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
              <Toggle label="Weekly digest" hint="Every Monday, one summary email." checked={notif.digest} onChange={(v) => setNotif({ ...notif, digest: v })} />
              <Toggle label="Critical only" hint="Suppress everything except critical severity." checked={notif.criticalOnly} onChange={(v) => setNotif({ ...notif, criticalOnly: v })} />
            </div>
            <FooterSave onClick={() => save("notifications", notif)} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="security">
          <SectionCard title="Security" description="Access, sessions and MFA policies.">
            <div className="divide-y divide-border">
              <Toggle label="Two-factor authentication" hint="Require TOTP on every sign-in." checked={security.twoFa} onChange={(v) => setSecurity({ ...security, twoFa: v })} />
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Session timeout (minutes)</Label>
                  <Input type="number" value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">IP allowlist (comma-separated)</Label>
                  <Input value={security.ipAllowlist} placeholder="10.0.0.0/24, 203.0.113.5" onChange={(e) => setSecurity({ ...security, ipAllowlist: e.target.value })} />
                </div>
              </div>
            </div>
            <FooterSave onClick={() => save("security", security)} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="appearance">
          <SectionCard title="Appearance" description="Theme and layout density.">
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">Dark mode</div>
                  <div className="text-[11px] text-muted-foreground">Toggle the workspace theme.</div>
                </div>
                <button
                  onClick={() => {
                    const next = !appearance.dark;
                    setAppearance({ ...appearance, dark: next });
                    document.documentElement.classList.toggle("dark", next);
                    toast.success(`${next ? "Dark" : "Light"} mode`);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12px] font-semibold hover:bg-accent"
                >
                  {appearance.dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {appearance.dark ? "Switch to Light" : "Switch to Dark"}
                </button>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Layout density</Label>
                  <div className="flex gap-2">
                    {["compact", "comfortable", "spacious"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setAppearance({ ...appearance, density: d })}
                        className={`h-8 rounded-md border px-3 text-[12px] font-semibold capitalize transition-colors ${
                          appearance.density === d ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-accent"
                        }`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <FooterSave onClick={() => save("appearance", appearance)} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="team">
          <SectionCard title="Team & Roles" description="Invite Boss Panel operators.">
            <div className="p-5">
              <Card className="border-dashed bg-surface/40 p-6 text-center">
                <SettingsIcon className="mx-auto h-6 w-6 text-muted-foreground" />
                <div className="mt-3 text-sm font-semibold">Team management coming with auth</div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Roles (Boss, Ops, Finance, Compliance) will be wired once sign-in is enabled.
                </p>
              </Card>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px]">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FooterSave({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end border-t border-border px-5 py-3">
      <button
        onClick={onClick}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Save className="h-3.5 w-3.5" /> Save Changes
      </button>
    </div>
  );
}
