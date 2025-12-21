import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Heart, ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Candidate } from '@/lib/matching';

interface ProfileDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: Candidate | null;
    onLike?: () => void;
}

export default function ProfileDetailsDialog({ isOpen, onOpenChange, candidate, onLike }: ProfileDetailsDialogProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gallery, setGallery] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && candidate) {
            const fetchGallery = async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sb: any = supabase;
                const { data } = await sb
                    .from('user_gallery')
                    .select('*')
                    .eq('user_id', candidate.user_id)
                    .eq('is_private', false)
                    .order('created_at', { ascending: false });
                if (data) setGallery(data);
            };
            fetchGallery();
        } else {
            setGallery([]);
        }
    }, [isOpen, candidate]);

    if (!candidate) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {candidate.full_name}, {candidate.age}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-base mt-2">
                        <GraduationCap className="h-4 w-4" /> {candidate.branch} • {candidate.college_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {candidate.profile_image_url && (
                        <img
                            src={candidate.profile_image_url}
                            alt={candidate.full_name}
                            className="w-full h-80 object-cover rounded-xl shadow-sm"
                        />
                    )}

                    <div className="prose dark:prose-invert max-w-none">
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {candidate.bio || 'No bio provided.'}
                        </p>
                    </div>

                    {/* Basic Info & Lifestyle Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basics</h4>
                            <div className="space-y-2 text-sm">
                                {candidate.gender && <div className="flex justify-between"><span>Gender</span><span className="font-medium">{candidate.gender}</span></div>}
                                {candidate.looking_for && <div className="flex justify-between"><span>Looking For</span><span className="font-medium text-primary">{candidate.looking_for}</span></div>}
                                {candidate.height && <div className="flex justify-between"><span>Height</span><span className="font-medium">{candidate.height}</span></div>}
                                {candidate.zodiac && <div className="flex justify-between"><span>Zodiac</span><span className="font-medium">{candidate.zodiac}</span></div>}
                                {candidate.religion && <div className="flex justify-between"><span>Religion</span><span className="font-medium">{candidate.religion}</span></div>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Lifestyle</h4>
                            <div className="space-y-2 text-sm">
                                {candidate.drinking && <div className="flex justify-between"><span>Drinking</span><span className="font-medium">{candidate.drinking}</span></div>}
                                {candidate.smoking && <div className="flex justify-between"><span>Smoking</span><span className="font-medium">{candidate.smoking}</span></div>}
                                {candidate.fitness && <div className="flex justify-between"><span>Fitness</span><span className="font-medium">{candidate.fitness}</span></div>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {candidate.interests?.map((interest) => (
                                <span key={interest} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Public Gallery */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            Gallery
                        </h3>
                        {gallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {gallery.map((img) => (
                                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                                        <img src={img.image_url} alt="Gallery" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No public photos shared.</p>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        {onLike && (
                            <Button onClick={() => { onOpenChange(false); onLike(); }} className="bg-pink-600 hover:bg-pink-700">
                                <Heart className="w-4 h-4 mr-2 fill-current" /> Like Profile
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
