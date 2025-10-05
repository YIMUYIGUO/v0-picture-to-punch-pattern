-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public patterns are viewable by everyone" ON public.shared_patterns;
DROP POLICY IF EXISTS "Users can view their own patterns" ON public.shared_patterns;
DROP POLICY IF EXISTS "Admins can view all patterns" ON public.shared_patterns;

-- Recreate public read policy with explicit conditions
CREATE POLICY "Public patterns are viewable by everyone" ON public.shared_patterns
  FOR SELECT 
  USING (
    is_public = true 
    AND (approval_status IS NULL OR approval_status = 'approved')
  );

-- Allow users to view their own patterns regardless of public status
CREATE POLICY "Users can view their own patterns" ON public.shared_patterns
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow admins to view all patterns
CREATE POLICY "Admins can view all patterns" ON public.shared_patterns
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant anonymous access to read public patterns
GRANT SELECT ON public.shared_patterns TO anon;
GRANT SELECT ON public.shared_patterns TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.shared_patterns ENABLE ROW LEVEL SECURITY;

-- Update any patterns with blob URLs to have a placeholder
-- (This is a temporary fix - users should re-upload with proper URLs)
UPDATE public.shared_patterns 
SET image_url = '/placeholder.svg?height=400&width=600&query=' || COALESCE(title, 'pattern')
WHERE image_url LIKE 'blob:%';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for shared_patterns table';
  RAISE NOTICE 'Updated % patterns with blob URLs to use placeholders', 
    (SELECT COUNT(*) FROM public.shared_patterns WHERE image_url LIKE '/placeholder.svg%');
END $$;
