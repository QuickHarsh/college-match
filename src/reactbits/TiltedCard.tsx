import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltedCardProps {
    children?: React.ReactNode;
    className?: string;
    containerHeight?: string | number;
    containerWidth?: string | number;
    imageSrc?: string;
    altText?: string;
    captionText?: string;
    scaleOnHover?: number;
    rotateAmplitude?: number;
    showMobileWarning?: boolean;
    showTooltip?: boolean;
    displayOverlayContent?: boolean;
    overlayContent?: React.ReactNode;
}

export default function TiltedCard({
    children,
    className = "",
    containerHeight = "300px",
    containerWidth = "100%",
    imageSrc,
    altText = "Tilted card image",
    captionText = "",
    scaleOnHover = 1.1,
    rotateAmplitude = 14,
    showMobileWarning = true,
    showTooltip = true,
    displayOverlayContent = false,
    overlayContent = null,
}: TiltedCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [rotateAmplitude, -rotateAmplitude]), {
        stiffness: 150,
        damping: 30,
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-rotateAmplitude, rotateAmplitude]), {
        stiffness: 150,
        damping: 30,
    });
    const scale = useSpring(1, {
        stiffness: 150,
        damping: 30,
    });

    function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseEnter() {
        scale.set(scaleOnHover);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
        scale.set(1);
    }

    return (
        <motion.div
            ref={ref}
            className={`relative z-10 flex items-center justify-center overflow-visible ${className}`}
            onMouseMove={handleMouse}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                height: containerHeight,
                width: containerWidth,
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
                scale,
            }}
        >
            {/* Content */}
            <div
                className="relative h-full w-full rounded-[15px] overflow-hidden shadow-xl border border-white/10 bg-white/5 backdrop-blur-sm"
                style={{
                    transform: "translateZ(0)",
                }}
            >
                {imageSrc && (
                    <img
                        src={imageSrc}
                        alt={altText}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}

                {displayOverlayContent && overlayContent && (
                    <div className="absolute inset-0 z-20">
                        {overlayContent}
                    </div>
                )}

                {/* Default Children Render */}
                {!imageSrc && !displayOverlayContent && (
                    <div className="h-full w-full">
                        {children}
                    </div>
                )}
            </div>

            {/* Tooltip / Caption */}
            {showTooltip && captionText && (
                <motion.div
                    className="absolute left-4 bottom-4 z-30 rounded-lg bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-md border border-white/10 shadow-lg"
                    style={{
                        x,
                        y,
                        rotateX,
                        rotateY,
                        translateZ: 60, // Float above
                    }}
                >
                    {captionText}
                </motion.div>
            )}
        </motion.div>
    );
}
