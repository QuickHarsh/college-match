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
import { Heart, User, GraduationCap, Sparkles, X, Save, Image as ImageIcon, Plus, Trash2, Lock, Globe, Loader2 } from 'lucide-react';
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

interface GalleryImage {
  id: string;
  image_url: string;
  is_private: boolean;
}

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    college_name: '',
    branch: '',
    year_of_study: '',
    age: '',
    bio: '',
    interests: [] as string[],
    profile_image_url: '',
    gender: user?.user_metadata?.gender || '',
    preferred_gender: 'Everyone',
    looking_for: '',
    height: '',
    zodiac: '',
    religion: '',
    drinking: '',
    smoking: '',
    fitness: ''
  });
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const fetchGallery = useCallback(async () => {
    if (!user) return;
    const sb: any = supabase;
    const { data } = await sb
      .from('user_gallery')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setGallery(data);
  }, [user]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setUploadingGallery(true);
    try {
      const sb: any = supabase;
      const files = Array.from(e.target.files);
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await sb.storage
          .from('gallery-images')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = sb.storage
          .from('gallery-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await sb
          .from('user_gallery')
          .insert({ user_id: user.id, image_url: publicUrl });
        if (dbError) throw dbError;
      }
      await fetchGallery();
      toast({ title: "Photos added", description: "Your gallery has been updated." });
    } catch (error) {
      console.error(error);
      toast({ title: "Upload failed", description: "Could not upload photos.", variant: "destructive" });
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteImage = async (id: string, url: string) => {
    try {
      const sb: any = supabase;
      // Optimistic update
      setGallery(prev => prev.filter(img => img.id !== id));

      const { error } = await sb.from('user_gallery').delete().eq('id', id);
      if (error) throw error;

      // Try to delete from storage (optional, best effort)
      const path = url.split('/').pop(); // simplistic path extraction
      if (path && user) {
        await sb.storage.from('gallery-images').remove([`${user.id}/${path}`]);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Delete failed", description: "Could not delete photo.", variant: "destructive" });
      fetchGallery(); // Revert
    }
  };

  const handleTogglePrivacy = async (id: string, currentStatus: boolean) => {
    try {
      const sb: any = supabase;
      setGallery(prev => prev.map(img => img.id === id ? { ...img, is_private: !currentStatus } : img));
      const { error } = await sb
        .from('user_gallery')
        .update({ is_private: !currentStatus })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error(error);
      toast({ title: "Update failed", description: "Could not update privacy.", variant: "destructive" });
      fetchGallery(); // Revert
    }
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_id', user.id)
      .single();

    const profileData = data as any;

    if (profileData && !error) {
      setProfile({
        full_name: profileData.full_name || '',
        college_name: profileData.college_name || '',
        branch: profileData.branch || '',
        year_of_study: profileData.year_of_study?.toString() || '',
        age: profileData.age?.toString() || '',
        bio: profileData.bio || '',
        interests: (profileData.interests as string[]) || [],
        profile_image_url: profileData.profile_image_url || '',
        gender: profileData.gender || '',
        preferred_gender: profileData.preferred_gender || 'Everyone',
        looking_for: profileData.looking_for || '',
        height: profileData.height || '',
        zodiac: profileData.zodiac || '',
        religion: profileData.religion || '',
        drinking: profileData.drinking || '',
        smoking: profileData.smoking || '',
        fitness: profileData.fitness || ''
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
    fetchGallery();
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
          gender: profile.gender,
          preferred_gender: profile.preferred_gender,
          looking_for: profile.looking_for,
          height: profile.height,
          zodiac: profile.zodiac,
          religion: profile.religion,
          drinking: profile.drinking,
          smoking: profile.smoking,
          fitness: profile.fitness,
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
              Let's set up your profile to find your perfect KeenQ match!
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

                {/* Personal Details */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <User className="h-5 w-5" />
                    Personal Details
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={profile.gender} onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Non-binary">Non-binary</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_gender">Interested In</Label>
                      <Select value={profile.preferred_gender} onValueChange={(value) => setProfile(prev => ({ ...prev, preferred_gender: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Everyone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Men</SelectItem>
                          <SelectItem value="Female">Women</SelectItem>
                          <SelectItem value="Everyone">Everyone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="looking_for">Looking For</Label>
                      <Select value={profile.looking_for} onValueChange={(value) => setProfile(prev => ({ ...prev, looking_for: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Select intent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Relationship">Relationship</SelectItem>
                          <SelectItem value="Friends">Friends</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Study Buddy">Study Buddy</SelectItem>
                          <SelectItem value="Networking">Networking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        value={profile.height}
                        onChange={(e) => setProfile(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="e.g. 5'10"
                        className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zodiac">Zodiac Sign</Label>
                      <Select value={profile.zodiac} onValueChange={(value) => setProfile(prev => ({ ...prev, zodiac: value }))}>
                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11">
                          <SelectValue placeholder="Select Sign" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(z => (
                            <SelectItem key={z} value={z}>{z}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="religion">Religion</Label>
                      <Input
                        id="religion"
                        value={profile.religion}
                        onChange={(e) => setProfile(prev => ({ ...prev, religion: e.target.value }))}
                        placeholder="Optional"
                        className="bg-background/50 border-muted-foreground/20 focus:border-primary h-11"
                      />
                    </div>
                  </div>

                  {/* Lifestyle Section */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-base font-semibold">Lifestyle Habits</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="drinking" className="text-xs text-muted-foreground">Drinking</Label>
                        <Select value={profile.drinking} onValueChange={(value) => setProfile(prev => ({ ...prev, drinking: value }))}>
                          <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Socially">Socially</SelectItem>
                            <SelectItem value="Frequently">Frequently</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smoking" className="text-xs text-muted-foreground">Smoking</Label>
                        <Select value={profile.smoking} onValueChange={(value) => setProfile(prev => ({ ...prev, smoking: value }))}>
                          <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Socially">Socially</SelectItem>
                            <SelectItem value="Frequently">Frequently</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fitness" className="text-xs text-muted-foreground">Fitness</Label>
                        <Select value={profile.fitness} onValueChange={(value) => setProfile(prev => ({ ...prev, fitness: value }))}>
                          <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Sometimes">Sometimes</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Gym Rat">Gym Rat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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

                {/* Gallery Section */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <ImageIcon className="h-5 w-5" />
                      My Gallery
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingGallery}>
                        {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Add Photos
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload photos to showcase your personality. Toggle the lock icon to make photos private (visible only to matches).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {gallery.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                        <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white border-none"
                            onClick={() => handleTogglePrivacy(img.id, img.is_private)}
                          >
                            {img.is_private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleDeleteImage(img.id, img.image_url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {img.is_private && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-1 rounded-full">
                            <Lock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {gallery.length === 0 && (
                      <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                        No photos yet. Add some to stand out!
                      </div>
                    )}
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
