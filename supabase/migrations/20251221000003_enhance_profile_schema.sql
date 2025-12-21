-- Add Bumble-style profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Other')),
ADD COLUMN IF NOT EXISTS preferred_gender TEXT DEFAULT 'Everyone' CHECK (preferred_gender IN ('Male', 'Female', 'Everyone')),
ADD COLUMN IF NOT EXISTS looking_for TEXT CHECK (looking_for IN ('Relationship', 'Friends', 'Casual', 'Study Buddy', 'Networking')),
ADD COLUMN IF NOT EXISTS height TEXT, -- Store as string like "5'10"" or "178cm"
ADD COLUMN IF NOT EXISTS zodiac TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS drinking TEXT CHECK (drinking IN ('Never', 'Socially', 'Frequently')),
ADD COLUMN IF NOT EXISTS smoking TEXT CHECK (smoking IN ('Never', 'Socially', 'Frequently')),
ADD COLUMN IF NOT EXISTS fitness TEXT CHECK (fitness IN ('Never', 'Sometimes', 'Active', 'Gym Rat'));

-- Update RLS to allow reading these new columns (already covered by "Select *")
-- But good practice to explicitly comment.

-- Add index for filtering by gender could be useful later
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
