import { useRef, useEffect } from "react";

interface PixelTrailProps {
    pixelSize?: number;
    fadeDuration?: number;
    pixelColor?: string;
    className?: string;
}

export default function PixelTrail({
    pixelSize = 20,
    fadeDuration = 500,
    pixelColor = "#3b82f6", // Default blue
    className = "",
}: PixelTrailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let pixels: { x: number; y: number; alpha: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            pixels = pixels.filter((p) => p.alpha > 0);
            pixels.forEach((p) => {
                p.alpha -= 1 / (fadeDuration / 16); // Approx 60fps
                if (p.alpha < 0) p.alpha = 0;

                ctx.fillStyle = pixelColor;
                ctx.globalAlpha = p.alpha;
                ctx.fillRect(p.x, p.y, pixelSize, pixelSize);
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / pixelSize) * pixelSize;
            const y = Math.floor((e.clientY - rect.top) / pixelSize) * pixelSize;

            // Only add if not already there (simple check)
            if (!pixels.some((p) => p.x === x && p.y === y && p.alpha > 0.5)) {
                pixels.push({ x, y, alpha: 1 });
            }
        };

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);

        resize();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [pixelSize, fadeDuration, pixelColor]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none z-0 ${className}`}
            style={{ width: "100%", height: "100%" }}
        />
    );
}
