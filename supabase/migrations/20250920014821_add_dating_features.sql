-- Add additional tables for dating platform features

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  compatibility_score INTEGER DEFAULT 0,
  is_mutual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Create compatibility quiz table
CREATE TABLE public.compatibility_quiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  college_name TEXT,
  event_type TEXT DEFAULT 'fest',
  max_participants INTEGER,
  created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create interest clubs table
CREATE TABLE public.interest_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club members table
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.interest_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user coins table
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 20, -- Start with 20 free coins
  total_earned INTEGER DEFAULT 20,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coin transactions table
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earning, negative for spending
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'purchased'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'sticker'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
ON public.matches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user1_id);

-- Create policies for likes
CREATE POLICY "Users can view likes they gave or received"
ON public.likes FOR SELECT TO authenticated
USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create likes"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = liker_id);

-- Create policies for compatibility quiz
CREATE POLICY "Users can view their own quiz answers"
ON public.compatibility_quiz FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz answers"
ON public.compatibility_quiz FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz answers"
ON public.compatibility_quiz FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY "Users can view all events"
ON public.events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create policies for event participants
CREATE POLICY "Users can view event participants"
ON public.event_participants FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can join events"
ON public.event_participants FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policies for interest clubs
CREATE POLICY "Users can view all clubs"
ON public.interest_clubs FOR SELECT TO authenticated
USING (true);

-- Create policies for club members
CREATE POLICY "Users can view club members"
ON public.club_members FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can join clubs"
ON public.club_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policies for user badges
CREATE POLICY "Users can view all badges"
ON public.user_badges FOR SELECT TO authenticated
USING (true);

-- Create policies for user coins
CREATE POLICY "Users can view their own coins"
ON public.user_coins FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins"
ON public.user_coins FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Create policies for coin transactions
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create policies for chat rooms
CREATE POLICY "Users can view their own chat rooms"
ON public.chat_rooms FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.matches m 
  WHERE m.id = match_id AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
));

-- Create policies for messages
CREATE POLICY "Users can view messages in their chat rooms"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_rooms cr
  JOIN public.matches m ON m.id = cr.match_id
  WHERE cr.id = chat_room_id AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
));

CREATE POLICY "Users can send messages in their chat rooms"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND EXISTS (
  SELECT 1 FROM public.chat_rooms cr
  JOIN public.matches m ON m.id = cr.match_id
  WHERE cr.id = chat_room_id AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
));

-- Create policies for blocked users
CREATE POLICY "Users can view their own blocks"
ON public.blocked_users FOR SELECT TO authenticated
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
ON public.blocked_users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = blocker_id);

-- Create policies for reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Insert default interest clubs
INSERT INTO public.interest_clubs (name, description, category, icon) VALUES
('Anime & Manga', 'For anime and manga enthusiasts', 'Entertainment', '🎌'),
('Tech & Programming', 'Coding, tech talks, and innovation', 'Technology', '💻'),
('Fitness & Sports', 'Stay active and healthy together', 'Health', '💪'),
('Music & Arts', 'Musicians, artists, and creative minds', 'Creative', '🎵'),
('Gaming', 'Video games, board games, and esports', 'Entertainment', '🎮'),
('Photography', 'Capture moments and share perspectives', 'Creative', '📸'),
('Books & Literature', 'Book lovers and literature enthusiasts', 'Education', '📚'),
('Travel & Adventure', 'Explore new places and cultures', 'Lifestyle', '✈️'),
('Food & Cooking', 'Foodies and cooking enthusiasts', 'Lifestyle', '🍕'),
('Dance', 'All forms of dance and movement', 'Creative', '💃');

-- Create function to automatically create user coins when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_coins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance, total_earned, total_spent)
  VALUES (NEW.user_id, 20, 20, 0);
  
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.user_id, 20, 'earned', 'Welcome bonus - 20 free coins!');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create coins when profile is created
CREATE TRIGGER on_profile_created_coins
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_coins();

-- Create function to handle mutual matches
CREATE OR REPLACE FUNCTION public.check_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a reverse like (mutual match)
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    -- Create mutual match
    INSERT INTO public.matches (user1_id, user2_id, is_mutual)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id),
      true
    )
    ON CONFLICT (user1_id, user2_id) DO UPDATE SET is_mutual = true;
    
    -- Create chat room for the match
    INSERT INTO public.chat_rooms (match_id)
    SELECT id FROM public.matches 
    WHERE user1_id = LEAST(NEW.liker_id, NEW.liked_id) 
    AND user2_id = GREATEST(NEW.liker_id, NEW.liked_id)
    ON CONFLICT (match_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to check for mutual matches when someone likes
CREATE TRIGGER on_like_created_check_match
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.check_mutual_match();
