import AnimatedContent from '@/reactbits/AnimatedContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, HeartHandshake, Shield, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import PixelTrail from '@/reactbits/PixelTrail';
import SpotlightCard from '@/reactbits/SpotlightCard';
import ShinyText from '@/reactbits/ShinyText';

const devImage = 'https://i.pravatar.cc/300?img=13'; // TODO: replace with your actual image URL

export default function About() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-20">
      <PixelTrail pixelSize={24} fadeDuration={800} pixelColor="rgba(236, 72, 153, 0.15)" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            <ShinyText text="About CollegeMatch" disabled={false} speed={3} className="inline-block" />
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            CollegeMatch helps students connect through shared interests, clubs, and events.
            Find meaningful matches, chat in real-time, and build your campus community.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm backdrop-blur-md bg-background/50 border-primary/20"><Sparkles className="h-4 w-4 text-primary" /> Smart Matching</Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm backdrop-blur-md bg-background/50 border-primary/20"><Shield className="h-4 w-4 text-primary" /> Privacy-first</Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm backdrop-blur-md bg-background/50 border-primary/20"><Rocket className="h-4 w-4 text-primary" /> Fast & Modern</Badge>
          </div>
        </motion.section>

        {/* Co-founders full-width carousel */}
        <CoFoundersCarousel />

        {/* Highlights */}
        <section className="mt-20 grid gap-8 sm:grid-cols-2">
          <AnimatedContent direction="vertical" distance={40}>
            <SpotlightCard className="h-full bg-card/40 backdrop-blur-md border-white/10" spotlightColor="rgba(236, 72, 153, 0.1)">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <HeartHandshake className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold">What it is</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  CollegeMatch is a campus-focused social and matching platform. Take a compatibility quiz,
                  join clubs, attend events, and connect with like-minded peers. Chats, calls, and invites are built-in.
                </p>
              </div>
            </SpotlightCard>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={40} delay={0.1}>
            <SpotlightCard className="h-full bg-card/40 backdrop-blur-md border-white/10" spotlightColor="rgba(168, 85, 247, 0.1)">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <CheckCircle2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Best things</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground text-lg">
                  {[
                    'Smart compatibility quiz and matching',
                    'Real-time chat and video call invites',
                    'Discover clubs and campus events',
                    'Clean, mobile-friendly UI',
                    'Secure auth and profile controls'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        </section>
      </div>
    </div>
  );
}

// Full-width co-founders carousel implementation
function CoFoundersCarousel() {
  const slides = [
    {
      id: 'harsh',
      name: 'Harsh Patel',
      title: 'Co-founder • Lead Developer',
      praise:
        "I designed and built this app end-to-end — from real-time features and sleek animations to a polished, mobile-first UI. Let's build meaningful campus connections!",
      // Replace with your real photo URL
      img: 'harsh.jpg',
      durationMs: 8000, // Longer display for Harsh
    },
    {
      id: 'shikhar',
      name: 'Shikhar Singh',
      title: 'Co-founder',
      praise:
        'Driving vision, product thinking, and community impact to make CollegeMatch truly resonate with students.',
      img: 'shikhar.jpeg',
      durationMs: 3500, // Shorter display for Shikhar
    },
  ] as const;

  const [index, setIndex] = React.useState(0);
  const duration = slides[index].durationMs;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, duration);
    return () => clearTimeout(timeout);
  }, [index, duration, slides.length]);

  const active = slides[index];

  return (
    <section
      aria-label="Co-founders"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen mt-10"
    >
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-10 relative">
          <div className="rounded-3xl border bg-background/40 backdrop-blur-xl ring-1 ring-white/10 p-6 md:p-12 shadow-2xl">
            <div className="grid gap-10 md:grid-cols-[400px,1fr] items-center">
              <div className="mx-auto h-[320px] w-[320px] md:h-[400px] md:w-[400px] rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl relative group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active.id}
                    src={active.img}
                    alt={active.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    initial={{ opacity: 0.0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${active.id}-content`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
                      {active.name}
                    </h2>
                    <p className="text-xl text-primary font-medium mb-6">
                      {active.title}
                    </p>
                    <p className="text-xl text-muted-foreground leading-relaxed italic">
                      "{active.praise}"
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Dots */}
                <div className="pt-6 flex gap-3">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={`Show ${s.name}`}
                      onClick={() => setIndex(i)}
                      className={`h-3 rounded-full transition-all duration-300 ${i === index ? 'w-12 bg-primary' : 'w-3 bg-muted hover:bg-primary/50'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
