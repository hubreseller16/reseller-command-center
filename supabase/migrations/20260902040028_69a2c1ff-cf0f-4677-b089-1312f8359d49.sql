CREATE TABLE public.reseller_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_number text NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  requested_type text NOT NULL DEFAULT 'standard',
  risk_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted',
  notes text,
  reviewer text,
  submitted_at date NOT NULL DEFAULT current_date,
  decided_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_applications TO anon, authenticated;
GRANT ALL ON public.reseller_applications TO service_role;
ALTER TABLE public.reseller_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access to applications" ON public.reseller_applications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER reseller_applications_updated_at BEFORE UPDATE ON public.reseller_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.kyc_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.reseller_applications(id) ON DELETE CASCADE,
  record_key text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  reviewer text,
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX kyc_documents_record_key_idx ON public.kyc_documents (record_key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO anon, authenticated;
GRANT ALL ON public.kyc_documents TO service_role;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access to kyc documents" ON public.kyc_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();