/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Heart, User, GraduationCap, Sparkles, X, Save } from 'lucide-react';
import { useCallback } from 'react';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';
import MagnetLines from '@/reactbits/MagnetLines';
import SpotlightCard from '@/reactbits/SpotlightCard';
import ShinyText from '@/reactbits/ShinyText';
import StarBorder from '@/reactbits/StarBorder';

const INTERESTS = [
  'Anime & Manga', 'Tech & Programming', 'Fitness & Sports', 'Music & Arts',
  'Gaming', 'Photography', 'Books & Literature', 'Travel & Adventure',
  'Food & Cooking', 'Dance', 'Movies & TV', 'Fashion', 'Nature & Outdoors',
  'Volunteering', 'Entrepreneurship', 'Science', 'History', 'Languages'
];

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering',
  'Chemical Engineering', 'Biotechnology', 'Business Administration',
  'Economics', 'Psychology', 'English Literature', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Medicine', 'Law', 'Arts', 'Other'
];

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    college_name: '',
    branch: '',
    year_of_study: '',
    age: '',
    bio: '',
    interests: [] as string[],
    profile_image_url: ''
  });
  const [connectionsCount, setConnectionsCount] = useState<number>(0);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setProfile({
        full_name: data.full_name || '',
        college_name: data.college_name || '',
        branch: data.branch || '',
        year_of_study: data.year_of_study?.toString() || '',
        age: data.age?.toString() || '',
        bio: data.bio || '',
        interests: (data.interests as string[]) || [],
        profile_image_url: data.profile_image_url || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Load existing profile if it exists
    loadProfile();
    // Load connections count (head + count)
    (async () => {
      try {
        const sb: any = supabase as any;
        const { count, error } = await sb
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('is_mutual', true);
        if (error) throw error;
        setConnectionsCount(count || 0);
      } catch {
        // silent; profile still loads
      }
    })();
  }, [user, navigate, loadProfile]);

  const handleInterestToggle = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          college_email: user.email || '',
          full_name: profile.full_name,
          college_name: profile.college_name,
          branch: profile.branch,
          year_of_study: parseInt(profile.year_of_study),
          age: parseInt(profile.age),
          bio: profile.bio,
          interests: profile.interests,
          profile_image_url: profile.profile_image_url || null,
          is_verified: true // Auto-verify for now
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });

      navigate('/match');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error updating profile",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <MagnetLines rows={15} columns={15} containerSize="100%" lineColor="rgba(120, 120, 120, 0.2)" lineWidth="1px" lineHeight="30px" baseAngle={0} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="container mx-auto max-w-3xl p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-primary mx-auto mb-4 fill-current animate-pulse" />
            <h1 className="text-4xl font-extrabold mb-2">
              <ShinyText text="Complete Your Profile" disabled={false} speed={3} className="inline-block" />
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's set up your profile to find your perfect college match!
            </p>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">Connections: <span className="font-bold text-primary">{connectionsCount}</span></div>
            </div>
          </div>

          <SpotlightCard className="bg-card/60 backdrop-blur-xl border-white/10 shadow-2xl" spotlightColor="rgba(255, 255, 255, 0.1)">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">Tell us about yourself to get better matches</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Photo Upload */}
                <div className="space-y-4 flex flex-col items-center">
                  <Label className="text-base">Profile Photo</Label>
                  {user && (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative">
                        <ProfilePhotoUploader
                          userId={user.id}
                          value={profile.profile_image_url}
                          onChange={(url) => setProfile((p) => ({ ...p, profile_image_url: url }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                      className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="30"
                      value={profile.age}
                      onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                      required
                      className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11"
                    />
                  </div>
                </div>

                {/* College Information */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <GraduationCap className="h-5 w-5" />
                    College Information
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college_name">College Name</Label>
                    <Input
                      id="college_name"
                      value={profile.college_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, college_name: e.target.value }))}
                      placeholder="e.g., Indian Institute of Technology Delhi"
                      required
                      className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch/Major</Label>
                      <Select value={profile.branch} onValueChange={(value) => setProfile(prev => ({ ...prev, branch: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Select your branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCHES.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year_of_study">Year of Study</Label>
                      <Select value={profile.year_of_study} onValueChange={(value) => setProfile(prev => ({ ...prev, year_of_study: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                          <SelectItem value="5">5th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your hobbies, what you're looking for..."
                    rows={4}
                    className="bg-background/50 border-muted-foreground/20 focus:border-primary resize-none"
                  />
                </div>

                {/* Interests */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Sparkles className="h-5 w-5" />
                    Interests ({profile.interests.length}/8)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select up to 8 interests to help us find your perfect match
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const isSelected = profile.interests.includes(interest);
                      return (
                        <Badge
                          key={interest}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-all px-3 py-1.5 text-sm ${isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                            : "hover:bg-primary/10 border-muted-foreground/30"
                            } ${profile.interests.length >= 8 && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => {
                            if (profile.interests.length < 8 || isSelected) {
                              handleInterestToggle(interest);
                            }
                          }}
                        >
                          {interest}
                          {isSelected && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6">
                  <StarBorder as="button" className="w-full cursor-pointer" color="cyan" speed="4s" disabled={loading}>
                    <span className="flex items-center justify-center font-bold text-lg py-1">
                      {loading ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Profile & Start Matching</>}
                    </span>
                  </StarBorder>
                </div>
              </form>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </div>
  );
}
