import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';

export type Slide = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
  imageUrl?: string; // Optional background image
  accent?: string;   // Tailwind color class e.g., 'from-pink-500/60 to-red-500/60'
};

export default function CarouselHero({ slides, interval = 4500 }: { slides: Slide[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const active = slides[index % slides.length];
  const slideRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  // GSAP text reveal on each slide change
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (slideRef.current) {
      tl.fromTo(slideRef.current, { opacity: 0.85, scale: 1.015 }, { opacity: 1, scale: 1, duration: 0.45 }, 0);
    }
    if (titleRef.current) {
      tl.fromTo(titleRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.05);
    }
    if (subtitleRef.current) {
      tl.fromTo(subtitleRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.15);
    }
    if (ctaRef.current) {
      tl.fromTo(ctaRef.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, 0.25);
    }
    return () => {
      tl.kill();
    };
  }, [active.id]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [slides.length, interval]);

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length);

  const indicators = useMemo(() => new Array(slides.length).fill(0), [slides.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[16/7] w-full">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active.id}
            className="h-full w-full relative"
            style={{
              backgroundImage: active.imageUrl
                ? `linear-gradient(to bottom right, rgba(0,0,0,0.35), rgba(0,0,0,0.25)), url(${active.imageUrl})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            ref={slideRef}
          >
            {!active.imageUrl && (
              <div className={`absolute inset-0 bg-gradient-to-br ${active.accent || 'from-primary/20 to-secondary/20'}`} />
            )}
            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
              <div className="max-w-2xl">
                <Badge className="mb-3">{active.tag}</Badge>
                <h3 ref={titleRef} className="text-2xl md:text-4xl font-bold text-white drop-shadow">{active.title}</h3>
                <p ref={subtitleRef} className="mt-2 text-white/90 text-sm md:text-base">{active.subtitle}</p>
                <div ref={ctaRef} className="mt-4">
                  <Button size="sm" onClick={() => navigate(active.to)}>{active.cta}</Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2">
        <button aria-label="Prev" onClick={() => go(-1)} className="h-9 w-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button aria-label="Next" onClick={() => go(1)} className="h-9 w-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/60">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5">
        {indicators.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
