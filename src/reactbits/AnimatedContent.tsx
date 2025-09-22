import React, { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedContentProps {
  children: ReactNode;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string | ((progress: number) => number);
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  onComplete?: () => void;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  onComplete
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Use isomorphic layout effect to avoid hydration warnings in SSR,
  // and to ensure measurements/animations run before paint on the client.
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? React.useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const offset = reverse ? -distance : distance;
    const startPct = (1 - threshold) * 100;

    // Scope all GSAP effects to this component. ctx.revert() will clean up
    // only what we created here, including ScrollTriggers.
    const ctx = gsap.context(() => {
      gsap.set(el, {
        [axis]: offset,
        scale,
        opacity: animateOpacity ? initialOpacity : 1
      });

      gsap.to(el, {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease: ease,
        delay,
        onComplete,
        scrollTrigger: {
          trigger: el,
          start: `top ${startPct}%`,
          toggleActions: 'play none none none',
          once: true
        }
      });
    }, el);

    return () => ctx.revert();
  }, [
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    onComplete
  ]);

  return <div ref={ref}>{children}</div>;
};

export default AnimatedContent;
