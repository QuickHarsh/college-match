import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Heart, User, GraduationCap, Calendar, MapPin, Sparkles, X } from 'lucide-react';
import { useCallback } from 'react';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-primary mx-auto mb-4 fill-current" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Let's set up your profile to find your perfect college match!
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Tell us about yourself to get better matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  {user && (
                    <ProfilePhotoUploader
                      userId={user.id}
                      value={profile.profile_image_url}
                      onChange={(url) => setProfile((p) => ({ ...p, profile_image_url: url }))}
                    />
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      required
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
                    />
                  </div>
                </div>

                {/* College Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
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
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch/Major</Label>
                      <Select value={profile.branch} onValueChange={(value) => setProfile(prev => ({ ...prev, branch: value }))}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                  />
                </div>

                {/* Interests */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
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
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-primary/10"
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

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Saving..." : "Save Profile & Start Matching"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
