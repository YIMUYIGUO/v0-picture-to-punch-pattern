-- Create shared_patterns table for storing user-shared punch patterns
CREATE TABLE IF NOT EXISTS public.shared_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  original_image_url TEXT,
  panel_width INTEGER NOT NULL,
  panel_height INTEGER NOT NULL,
  hole_diameter DECIMAL NOT NULL,
  hole_spacing DECIMAL NOT NULL,
  conversion_mode VARCHAR(50) NOT NULL,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table for tracking user likes
CREATE TABLE IF NOT EXISTS public.pattern_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.shared_patterns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pattern_id)
);

-- Enable RLS
ALTER TABLE public.shared_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_patterns
CREATE POLICY "Public patterns are viewable by everyone" ON public.shared_patterns
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own patterns" ON public.shared_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns" ON public.shared_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" ON public.shared_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns" ON public.shared_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pattern_likes
CREATE POLICY "Anyone can view likes" ON public.pattern_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like patterns" ON public.pattern_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike patterns" ON public.pattern_likes
  FOR DELETE USING (auth.uid() = user_id);
