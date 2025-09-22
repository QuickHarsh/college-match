import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Events() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">College Events</h1>
            <p className="text-muted-foreground">Join fests, meetups, hackathons and more on campus.</p>
          </div>
          <Button onClick={() => {/* TODO: open create event modal */}}>
            <PlusCircle className="h-4 w-4 mr-2" /> Create Event
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} whileHover={{ y: -4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Freshers Mixer
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Main Auditorium • Sep 30, 6:00 PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Meet fellow students across branches; fun icebreakers and games.
                </p>
                <Button onClick={() => {/* TODO: join event */}}>Join Event</Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.05 }} whileHover={{ y: -4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Coding Hack Night
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Lab 3 • Oct 5, 8:00 PM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Team up, build something cool, and meet other tech enthusiasts.
                </p>
                <Button variant="secondary" onClick={() => {/* TODO: join event */}}>Join Event</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
