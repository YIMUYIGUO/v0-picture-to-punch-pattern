-- Create shared_patterns table for storing user-shared punch patterns
CREATE TABLE IF NOT EXISTS shared_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  pattern_data JSONB NOT NULL, -- Store pattern parameters and settings
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
CREATE TABLE IF NOT EXISTS pattern_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES shared_patterns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pattern_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_patterns_user_id ON shared_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_created_at ON shared_patterns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_likes_count ON shared_patterns(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_public ON shared_patterns(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pattern_likes_pattern_id ON pattern_likes(pattern_id);

-- Enable RLS
ALTER TABLE shared_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_patterns
CREATE POLICY "Public patterns are viewable by everyone" ON shared_patterns
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own patterns" ON shared_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns" ON shared_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" ON shared_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns" ON shared_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pattern_likes
CREATE POLICY "Anyone can view likes" ON pattern_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like patterns" ON pattern_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike patterns" ON pattern_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_pattern_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shared_patterns 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.pattern_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shared_patterns 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.pattern_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
CREATE TRIGGER trigger_update_pattern_likes_count
  AFTER INSERT OR DELETE ON pattern_likes
  FOR EACH ROW EXECUTE FUNCTION update_pattern_likes_count();

-- Function to update views count
CREATE OR REPLACE FUNCTION increment_pattern_views(pattern_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE shared_patterns 
  SET views_count = views_count + 1 
  WHERE id = pattern_uuid;
END;
$$ LANGUAGE plpgsql;
