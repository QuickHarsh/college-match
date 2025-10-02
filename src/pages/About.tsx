import AnimatedContent from '@/reactbits/AnimatedContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, HeartHandshake, Shield, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

const devImage = 'https://i.pravatar.cc/300?img=13'; // TODO: replace with your actual image URL

export default function About() {
  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-3xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">About CollegeMatch</h1>
        <p className="mt-3 text-muted-foreground">
          CollegeMatch helps students connect through shared interests, clubs, and events.
          Find meaningful matches, chat in real-time, and build your campus community.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-4 w-4" /> Smart Matching</Badge>
          <Badge variant="secondary" className="gap-1"><Shield className="h-4 w-4" /> Privacy-first</Badge>
          <Badge variant="secondary" className="gap-1"><Rocket className="h-4 w-4" /> Fast & Modern</Badge>
        </div>
      </motion.section>

      {/* Co-founders full-width carousel */}
      <CoFoundersCarousel />

      {/* Highlights */}
      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <AnimatedContent direction="vertical" distance={40}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-primary" /> What it is</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              CollegeMatch is a campus-focused social and matching platform. Take a compatibility quiz,
              join clubs, attend events, and connect with like-minded peers. Chats, calls, and invites are built-in.
            </CardContent>
          </Card>
        </AnimatedContent>
        <AnimatedContent direction="vertical" distance={40} delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Best things</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Smart compatibility quiz and matching</li>
                <li>Real-time chat and video call invites</li>
                <li>Discover clubs and campus events</li>
                <li>Clean, mobile-friendly UI</li>
                <li>Secure auth and profile controls</li>
              </ul>
            </CardContent>
          </Card>
        </AnimatedContent>
      </section>

      {/* Developer section */}
      {/* <section className="mt-12 grid gap-8 md:grid-cols-[320px,1fr] items-center">
        <AnimatedContent direction="horizontal" distance={60}>
          <div className="relative mx-auto h-72 w-72 md:h-80 md:w-80 rounded-xl overflow-hidden ring-1 ring-border shadow">
            <img
              src={devImage}
              alt="Developer photo"
              className="h-full w-full object-cover"
            />
          </div>
        </AnimatedContent>
        <AnimatedContent direction="vertical" distance={50} delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle>Built by Harsh Patel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Hi! I built this website to make it easier for students to meet, collaborate, and grow together.
                It blends a delightful UI with powerful real-time features.
              </p>
              <p>
                The animations you see are powered by GSAP/ScrollTrigger and Framer Motion. The stack includes React,
                Tailwind, React Router, and modern tooling for performance and developer experience.
              </p>
              <p className="text-sm italic">
                Tip: Replace the developer image URL in <code>src/pages/About.tsx</code> by setting <code>devImage</code>
                to your own hosted photo (or connect it to your profile image field).
              </p>
            </CardContent>
          </Card>
        </AnimatedContent>
      </section> */}
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
          <div className="rounded-2xl border bg-background/60 backdrop-blur-lg ring-1 ring-border p-6 md:p-10 shadow-sm">
            <div className="grid gap-6 md:grid-cols-[360px,1fr] items-center">
              <div className="mx-auto h-[320px] w-[320px] md:h-[360px] md:w-[360px] rounded-2xl overflow-hidden ring-1 ring-border shadow relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active.id}
                    src={active.img}
                    alt={active.name}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0.0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </AnimatePresence>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`${active.id}-name`}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="text-2xl sm:text-3xl font-bold tracking-tight"
                  >
                    {active.name}
                  </motion.h2>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${active.id}-title`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="text-primary font-medium"
                  >
                    {active.title}
                  </motion.p>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${active.id}-praise`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="text-muted-foreground"
                  >
                    {active.praise}
                  </motion.p>
                </AnimatePresence>

                {/* Dots */}
                <div className="pt-4 flex gap-2">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={`Show ${s.name}`}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === index ? 'w-8 bg-primary' : 'w-2.5 bg-muted'
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
