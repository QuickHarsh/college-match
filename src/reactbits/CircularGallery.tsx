import { useRef, useEffect, useState } from "react";
import {
    motion,
    useMotionValue,
    useAnimationFrame,
    PanInfo,
} from "framer-motion";

interface CircularGalleryProps {
    items: React.ReactNode[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    font?: string;
}

const CircularGallery: React.FC<CircularGalleryProps> = ({
    items,
    bend = 3,
    textColor = "#ffffff",
    borderRadius = 0.05,
    font = "bold 30px Helvetica, Arial, sans-serif",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [radius, setRadius] = useState(200);
    const rotation = useMotionValue(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateRadius = () => {
            if (containerRef.current) {
                // Adjust radius based on container width
                setRadius(Math.min(containerRef.current.offsetWidth / 2.2, 300));
            }
        };
        updateRadius();
        window.addEventListener("resize", updateRadius);
        return () => window.removeEventListener("resize", updateRadius);
    }, []);

    const angleStep = 360 / items.length;

    // Auto-rotate
    useAnimationFrame((t, delta) => {
        // Rotate slowly: delta is ms since last frame
        const moveBy = delta * 0.005; // Adjust speed here
        rotation.set(rotation.get() - moveBy);
    });

    const handlePan = (_: unknown, info: PanInfo) => {
        // Add velocity to rotation
        rotation.set(rotation.get() + info.delta.x * 0.1);
    };

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ height: "400px", perspective: "1000px" }}
        >
            <motion.div
                onPan={handlePan}
                style={{
                    transformStyle: "preserve-3d",
                    rotateY: rotation,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {items.map((item, index) => {
                    const angle = index * angleStep;
                    return (
                        <div
                            key={index}
                            className="absolute flex items-center justify-center backface-visible"
                            style={{
                                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                width: "200px",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {item}
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default CircularGallery;
