-- Roles backbone
CREATE TYPE public.app_role AS ENUM ('admin','manager','staff','viewer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Audit logs (immutable trail)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin/manager read audit" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs (actor_id, created_at DESC);

-- Activity events (human timeline)
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id text,
  verb text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff+ read activity" ON public.activity_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'staff'));
CREATE INDEX activity_events_entity_idx ON public.activity_events (entity_type, entity_id, created_at DESC);

-- Notifications (per recipient)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipient reads own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
CREATE POLICY "recipient marks own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_id, read_at, created_at DESC);
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Resellers (first real entity Wall)
CREATE TABLE public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  business_name text NOT NULL,
  contact_name text,
  email text NOT NULL,
  phone text,
  tier text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'pending',
  kyc_status text NOT NULL DEFAULT 'not_submitted',
  region text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resellers TO authenticated;
GRANT ALL ON public.resellers TO service_role;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff+ read resellers" ON public.resellers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "manager+ insert resellers" ON public.resellers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "manager+ update resellers" ON public.resellers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "admin delete resellers" ON public.resellers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER resellers_updated_at BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX resellers_status_idx ON public.resellers (status, created_at DESC);