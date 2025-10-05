-- Update shared_patterns table to require approval by default
ALTER TABLE public.shared_patterns ALTER COLUMN is_public SET DEFAULT false;

-- Update existing patterns that are currently public to remain public
-- (This preserves existing published patterns)
UPDATE public.shared_patterns 
SET is_public = true 
WHERE is_public = true;

-- Add approval status tracking
ALTER TABLE public.shared_patterns 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';

-- Update existing records
UPDATE public.shared_patterns 
SET approval_status = CASE 
  WHEN is_public = true THEN 'approved'
  ELSE 'pending'
END;

-- Add approval timestamp
ALTER TABLE public.shared_patterns 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Update existing approved patterns
UPDATE public.shared_patterns 
SET approved_at = updated_at 
WHERE is_public = true;

-- Add admin policies for pattern management
CREATE POLICY "Admins can view all patterns" ON public.shared_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all patterns" ON public.shared_patterns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete all patterns" ON public.shared_patterns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
