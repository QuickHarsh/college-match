import { useRef, useEffect } from "react";

interface MagnetLinesProps {
    rows?: number;
    columns?: number;
    containerSize?: string;
    lineColor?: string;
    lineWidth?: string;
    lineHeight?: string;
    baseAngle?: number;
    style?: React.CSSProperties;
}

export default function MagnetLines({
    rows = 9,
    columns = 9,
    containerSize = "80vmin",
    lineColor = "#efefef",
    lineWidth = "1vmin",
    lineHeight = "6vmin",
    baseAngle = -10,
    style = {},
}: MagnetLinesProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const items = container.querySelectorAll("span");

        const onPointerMove = (pointer: { x: number; y: number }) => {
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const b = pointer.x - centerX;
                const a = pointer.y - centerY;
                const c = Math.sqrt(a * a + b * b) || 1;
                const r =
                    ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > centerY ? 1 : -1);

                item.style.setProperty("--rotate", `${r}deg`);
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            onPointerMove({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e: TouchEvent) => {
            onPointerMove({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, []);

    const total = rows * columns;
    const spans = Array.from({ length: total }, (_, i) => (
        <span
            key={i}
            className="block origin-center"
            style={{
                backgroundColor: lineColor,
                width: lineWidth,
                height: lineHeight,
                transform: `rotate(${baseAngle}deg) rotate(var(--rotate, 0deg))`,
                willChange: "transform",
            }}
        />
    ));

    return (
        <div
            ref={containerRef}
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                width: containerSize,
                height: containerSize,
                gap: "2vmin", // Add some gap for better spacing
                ...style,
            }}
        >
            {spans}
        </div>
    );
}
