import { motion } from "framer-motion";

const LogoGridAnimation = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden relative perspective-1000">
            {/* Moving Grid Floor */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute inset-[-100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [transform-style:preserve-3d] [transform:rotateX(60deg)]"
                    animate={{ y: [0, 40] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
            </div>

            {/* Logo in 3D Space */}
            <motion.div
                className="relative z-10 p-8 rounded-2xl bg-black/50 backdrop-blur-md border border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <img src="/z-app-logo.png" alt="Logo" className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </motion.div>
            </motion.div>

            {/* Floating Elements */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-16 h-16 border border-primary/30"
                    initial={{
                        x: Math.random() * 400 - 200,
                        y: Math.random() * 400 - 200,
                        opacity: 0,
                        rotate: 0
                    }}
                    animate={{
                        y: [0, -100],
                        opacity: [0, 0.5, 0],
                        rotate: 90
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "linear",
                    }}
                    style={{ left: "50%", top: "60%" }}
                />
            ))}
        </div>
    );
};

export default LogoGridAnimation;
