/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  banner_image_url: string | null;
  start_time: string | null;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Events() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events' as any)
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;
        setEvents((data as any) || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">College Events</h1>
            <p className="text-muted-foreground">Join fests, meetups, hackathons and more on campus.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fetching && <p className="text-muted-foreground col-span-2 text-center">Loading events...</p>}
          {!fetching && events.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center">No upcoming events found.</p>
          )}

          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-5 w-5 text-primary" /> {event.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {event.location || 'TBD'} • {event.start_time ? new Date(event.start_time).toLocaleString() : 'Date TBD'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {event.banner_image_url && (
                    <img src={event.banner_image_url} alt={event.title} className="w-full h-40 object-cover rounded-md mb-4" />
                  )}
                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                    {event.description || 'No description provided.'}
                  </p>
                  <Button className="w-full mt-auto" onClick={() => setSelectedEvent(event)}>View Details</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" /> {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-base mt-2">
              <MapPin className="h-4 w-4" /> {selectedEvent?.location || 'TBD'} • {selectedEvent?.start_time ? new Date(selectedEvent.start_time).toLocaleString() : 'Date TBD'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {selectedEvent?.banner_image_url && (
              <img
                src={selectedEvent.banner_image_url}
                alt={selectedEvent.title}
                className="w-full h-64 object-cover rounded-lg shadow-sm"
              />
            )}

            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">About Event</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedEvent?.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
