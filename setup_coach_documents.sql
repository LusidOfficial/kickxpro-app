-- 1. Create the coach_documents table
CREATE TABLE IF NOT EXISTS public.coach_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'ID', 'Certification', 'CV'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add an `is_verified` column to profiles to show the global badge
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. Enable RLS on coach_documents
ALTER TABLE public.coach_documents ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for coach_documents
-- Policy: Coaches can insert their own documents
CREATE POLICY "Coaches can insert own documents" 
    ON public.coach_documents FOR INSERT 
    WITH CHECK (auth.uid() = coach_id);

-- Policy: Coaches can read their own documents
CREATE POLICY "Coaches can read own documents" 
    ON public.coach_documents FOR SELECT 
    USING (auth.uid() = coach_id);

-- Policy: Admins can read all documents
CREATE POLICY "Admins can read all documents" 
    ON public.coach_documents FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy: Admins can update all documents (to set is_verified)
CREATE POLICY "Admins can update all documents" 
    ON public.coach_documents FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Create Storage Bucket for coach documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('coach_documents', 'coach_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies
-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'coach_documents' AND auth.role() = 'authenticated');

-- Policy: Authenticated users can view
CREATE POLICY "Authenticated users can read documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'coach_documents' AND auth.role() = 'authenticated');
