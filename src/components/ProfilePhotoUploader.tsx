/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ImageUp, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  value?: string | null;
  onChange: (url: string) => void;
}

export default function ProfilePhotoUploader({ userId, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePick = () => fileRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await (supabase as any).storage.from('profiles').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = await (supabase as any).storage.from('profiles').getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl as string;
      if (!publicUrl) throw new Error('Failed to get public URL');
      onChange(publicUrl);
      toast({ title: 'Photo uploaded' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to upload photo';
      toast({ title: 'Upload error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handlePick} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageUp className="h-4 w-4 mr-2" />}
            {loading ? 'Uploading...' : 'Upload Photo'}
          </Button>
          <Input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Tip: Use a clear, friendly photo. Max size ~5MB.</p>
    </div>
  );
}
