CREATE POLICY "kyc docs read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'kyc-documents');
CREATE POLICY "kyc docs insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'kyc-documents');
CREATE POLICY "kyc docs update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'kyc-documents') WITH CHECK (bucket_id = 'kyc-documents');
CREATE POLICY "kyc docs delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'kyc-documents');