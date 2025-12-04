import { motion } from "framer-motion";

const cards = [
    { id: 1, color: "#ef4444", rotate: -6 }, // Red
    { id: 2, color: "#3b82f6", rotate: 0 },  // Blue
    { id: 3, color: "#10b981", rotate: 6 },  // Emerald
];

export default function MatchStack() {
    return (
        <div className="relative w-48 h-64 mx-auto">
            {cards.map((card, index) => (
                <motion.div
                    key={card.id}
                    className="absolute inset-0 rounded-2xl shadow-xl border border-white/20"
                    style={{
                        backgroundColor: card.color,
                        rotate: card.rotate,
                        zIndex: index,
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                >
                    <div className="h-2/3 bg-black/10 rounded-t-2xl" />
                    <div className="p-4">
                        <div className="h-2 w-2/3 bg-white/30 rounded mb-2" />
                        <div className="h-2 w-1/2 bg-white/30 rounded" />
                    </div>
                </motion.div>
            ))}

            {/* Floating Heart */}
            <motion.div
                className="absolute -right-4 -top-4 bg-white rounded-full p-3 shadow-lg z-10"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#ef4444"
                    className="w-6 h-6"
                >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
            </motion.div>
        </div>
    );
}
