import React from 'react';

// Lightweight animated aesthetic background that doesn't require Tailwind config.
// Uses CSS keyframes injected locally. Designed to sit absolutely behind content.
export default function AnimatedAestheticBG({ intensity = 0.6 }: { intensity?: number }) {
  const alpha = Math.max(0, Math.min(1, intensity));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes float1 { 0% { transform: translate(-10%, -10%) scale(1); } 50% { transform: translate(5%, 10%) scale(1.1); } 100% { transform: translate(-10%, -10%) scale(1); } }
        @keyframes float2 { 0% { transform: translate(30%, -20%) scale(1); } 50% { transform: translate(10%, 0%) scale(1.05); } 100% { transform: translate(30%, -20%) scale(1); } }
        @keyframes float3 { 0% { transform: translate(-20%, 30%) scale(1); } 50% { transform: translate(0%, 10%) scale(0.95); } 100% { transform: translate(-20%, 30%) scale(1); } }
        @keyframes shimmer { 0% { opacity: .25; } 50% { opacity: .6; } 100% { opacity: .25; } }
        .bg-blur { filter: blur(60px); }
      `}</style>
      {/* Soft gradient base */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,${alpha}), transparent 60%),
                     radial-gradient(1000px 500px at 90% 20%, rgba(236,72,153,${alpha*0.8}), transparent 60%),
                     radial-gradient(900px 500px at 20% 90%, rgba(34,197,94,${alpha*0.5}), transparent 60%),
                     radial-gradient(800px 400px at 80% 80%, rgba(14,165,233,${alpha*0.5}), transparent 60%)`
      }} />
      {/* Floating glows */}
      <div className="bg-blur absolute -left-40 -top-40 w-[55vw] h-[55vw] rounded-full" style={{
        background: `radial-gradient(circle at 50% 50%, rgba(99,102,241,${alpha}), rgba(99,102,241,0))`,
        animation: 'float1 28s ease-in-out infinite, shimmer 6s ease-in-out infinite',
      }} />
      <div className="bg-blur absolute right-[-30vw] top-[-20vw] w-[50vw] h-[50vw] rounded-full" style={{
        background: `radial-gradient(circle at 50% 50%, rgba(236,72,153,${alpha*0.9}), rgba(236,72,153,0))`,
        animation: 'float2 34s ease-in-out infinite, shimmer 7s ease-in-out infinite',
      }} />
      <div className="bg-blur absolute left-[-20vw] bottom-[-25vw] w-[60vw] h-[60vw] rounded-full" style={{
        background: `radial-gradient(circle at 50% 50%, rgba(14,165,233,${alpha*0.7}), rgba(14,165,233,0))`,
        animation: 'float3 40s ease-in-out infinite, shimmer 8s ease-in-out infinite',
      }} />
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
        backgroundSize: '3px 3px'
      }} />
    </div>
  );
}
