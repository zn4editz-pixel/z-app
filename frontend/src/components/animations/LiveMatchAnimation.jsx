import { useState, useEffect } from "react";
import { User, Zap, Sparkles } from "lucide-react";

// Rotating Captions
const CAPTIONS = [
    { text: "From Strangers to Friends.", color: "text-primary" },
    { text: "Random Video, Real Vibes.", color: "text-secondary" },
    { text: "One Click, New World.", color: "text-accent" },
    { text: "Find Your Tribe.", color: "text-success" },
    { text: "Connect Across Borders.", color: "text-info" },
];

// Diverse "3D-style" Characters
// Using local assets for high-quality Pixar-style look
const CHARACTERS = [
    // Original Counterparts (Expanded)
    { country: "India", name: "Aarav", img: "/assets/avatars/india_male.png", bg: "bg-orange-100" },
    { country: "India", name: "Priya", img: "/assets/avatars/india_female.png", bg: "bg-orange-50" },

    { country: "Japan", name: "Yuki", img: "/assets/avatars/japan_female.png", bg: "bg-blue-100" },
    { country: "Japan", name: "Kenji", img: "/assets/avatars/japan_male.png", bg: "bg-blue-50" },

    { country: "USA", name: "Sarah", img: "/assets/avatars/usa_female.png", bg: "bg-red-100" },
    { country: "USA", name: "Mike", img: "/assets/avatars/usa_male.png", bg: "bg-red-50" },

    { country: "Brazil", name: "Mateo", img: "/assets/avatars/brazil_male.png", bg: "bg-yellow-100" },
    { country: "Brazil", name: "Isabela", img: "/assets/avatars/brazil_female.png", bg: "bg-yellow-50" },

    { country: "Korea", name: "Ji-Min", img: "/assets/avatars/korea_female.png", bg: "bg-pink-100" },
    { country: "Korea", name: "Jun-Ho", img: "/assets/avatars/korea_male.png", bg: "bg-indigo-50" },

    { country: "Australia", name: "Liam", img: "/assets/avatars/australia_male.png", bg: "bg-cyan-100" },
    { country: "Australia", name: "Chloe", img: "/assets/avatars/australia_female.png", bg: "bg-cyan-50" },

    // New European Set
    { country: "UK", name: "Harry", img: "/assets/avatars/uk_male.png", bg: "bg-slate-200" },
    { country: "UK", name: "Emily", img: "/assets/avatars/uk_female.png", bg: "bg-emerald-100" },

    { country: "France", name: "Leo", img: "/assets/avatars/france_male.png", bg: "bg-blue-200" },
    { country: "France", name: "Sophie", img: "/assets/avatars/france_female.png", bg: "bg-rose-100" },

    { country: "Germany", name: "Felix", img: "/assets/avatars/germany_male.png", bg: "bg-stone-200" },
    { country: "Germany", name: "Lena", img: "/assets/avatars/germany_female.png", bg: "bg-green-100" },

    { country: "Italy", name: "Marco", img: "/assets/avatars/italy_male.png", bg: "bg-amber-100" },
    { country: "Italy", name: "Giulia", img: "/assets/avatars/italy_female.png", bg: "bg-orange-200" },

    { country: "Canada", name: "Noah", img: "/assets/avatars/canada_male.png", bg: "bg-red-200" },

    // Middle East & Africa (Temporary placeholders using specific DiceBear seeds for cultural approximation)
    { country: "China", name: "Wei", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wei&backgroundColor=b6e3f4", bg: "bg-red-50" },
    { country: "China", name: "Li", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Li&backgroundColor=ffdfbf", bg: "bg-yellow-50" },

    { country: "Saudi Arabia", name: "Omar", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Omar&backgroundColor=d1d4f9&clothing=graphicShirt", bg: "bg-emerald-50" },
    { country: "Saudi Arabia", name: "Fatima", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima&backgroundColor=c0aede", bg: "bg-emerald-100" },

    { country: "UAE", name: "Hassan", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hassan&backgroundColor=ffdfbf", bg: "bg-stone-100" },
    { country: "UAE", name: "Amira", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amira&backgroundColor=b6e3f4", bg: "bg-stone-50" },

    { country: "Qatar", name: "Ahmed", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed&backgroundColor=d1d4f9", bg: "bg-purple-50" },
    { country: "Qatar", name: "Noor", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noor&backgroundColor=c0aede", bg: "bg-purple-100" },

    { country: "Egypt", name: "Youssef", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef&backgroundColor=ffdfbf", bg: "bg-orange-50" },
    { country: "Egypt", name: "Layla", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Layla&backgroundColor=b6e3f4", bg: "bg-amber-100" },

    { country: "South Africa", name: "Thabo", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thabo&backgroundColor=d1d4f9", bg: "bg-yellow-200" },
    { country: "South Africa", name: "Zola", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zola&backgroundColor=c0aede", bg: "bg-green-200" },
];

const LiveMatchAnimation = () => {
    const [step, setStep] = useState(0); // 0: Floating, 1: Snapping, 2: Merged
    const [captionIndex, setCaptionIndex] = useState(0);
    const [charIndexA, setCharIndexA] = useState(0);
    const [charIndexB, setCharIndexB] = useState(1);

    // Main Animation Cycle
    useEffect(() => {
        const cycle = async () => {
            while (true) {
                // Pick two DIFFERENT random characters for next round
                const idxA = Math.floor(Math.random() * CHARACTERS.length);
                let idxB = Math.floor(Math.random() * CHARACTERS.length);
                while (idxB === idxA) idxB = Math.floor(Math.random() * CHARACTERS.length);

                setCharIndexA(idxA);
                setCharIndexB(idxB);

                // Step 0: Floating independently (2.5s)
                setStep(0);
                await new Promise(r => setTimeout(r, 2500));

                // Step 1: Snap together (Zap effect) (0.6s)
                setStep(1);
                await new Promise(r => setTimeout(r, 600));

                // Step 2: Merged / Video Call (4s)
                setStep(2);
                await new Promise(r => setTimeout(r, 4000));
            }
        };
        cycle();
        return () => { };
    }, []);

    // Caption Cycle
    useEffect(() => {
        const interval = setInterval(() => {
            setCaptionIndex(prev => (prev + 1) % CAPTIONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const charA = CHARACTERS[charIndexA];
    const charB = CHARACTERS[charIndexB];

    // Function to generate random particles
    const renderParticles = () => {
        return [...Array(15)].map((_, i) => (
            <div
                key={i}
                className="absolute rounded-full bg-primary/20 animate-float-particle pointer-events-none"
                style={{
                    width: Math.random() * 6 + 2 + "px",
                    height: Math.random() * 6 + 2 + "px",
                    left: Math.random() * 100 + "%",
                    bottom: "-10px",
                    animationDuration: Math.random() * 10 + 5 + "s",
                    animationDelay: Math.random() * 5 + "s",
                }}
            />
        ));
    };

    return (
        <div className="w-full h-full bg-base-200 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">

            <style jsx>{`
                @keyframes float-particle {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    20% { opacity: 0.5; }
                    100% { transform: translateY(-120vh) translateX(${Math.random() * 50 - 25}px); opacity: 0; }
                }
                .animate-float-particle {
                    animation-name: float-particle;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                    animation-iteration-count: infinite;
                }
                .text-rolling-container {
                     height: 3rem;
                     overflow: hidden;
                     position: relative;
                     display: inline-block;
                     vertical-align: bottom;
                }
                .text-rolling-wrapper {
                     display: block;
                     transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>

            {/* Background Texture & Particles */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Ambient Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] animate-pulse delay-1000" />

            {/* Particles */}
            <div className="absolute inset-0 overflow-hidden">{renderParticles()}</div>

            {/* Animation Container */}
            <div className="relative w-full max-w-[320px] h-64 flex items-center justify-center z-10 perspective-1000">

                {/* Left Card: USER A */}
                <div
                    className={`
                        absolute w-32 h-48 bg-base-200 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${step === 0 ? "-translate-x-20 -rotate-6 scale-90 opacity-100 shadow-xl" : ""}
                        ${step === 1 ? "translate-x-0 rotate-0 scale-100 z-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]" : ""}
                        ${step === 2 ? "translate-x-0 w-[50%] h-56 rounded-r-none border-r-0 scale-100 z-10 left-1/2 -ml-[50%]" : ""}
                    `}
                >
                    <div className={`flex-1 ${charA.bg} flex items-center justify-center relative backdrop-blur-sm transition-colors duration-500`}>
                        {/* Character A Avatar - Always visible or revealed? Let's make it visible to show "You" are A */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 opacity-100"
                            style={{ backgroundImage: `url(${charA.img})` }}
                        />

                        {/* Name/Country Badge (Always visible for A?) */}
                        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
                            {charA.name} <span className="opacity-70">({charA.country})</span>
                        </div>
                    </div>
                </div>

                {/* Right Card: USER B (Stranger) */}
                <div
                    className={`
                        absolute w-32 h-48 bg-base-200 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${step === 0 ? "translate-x-20 rotate-6 scale-90 opacity-100 shadow-xl" : ""}
                        ${step === 1 ? "translate-x-0 rotate-0 scale-100 z-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]" : ""}
                        ${step === 2 ? "translate-x-0 w-[50%] h-56 rounded-l-none border-l-2 border-l-white/20 scale-100 z-10 left-1/2" : ""}
                    `}
                >
                    <div className={`flex-1 ${charB.bg} flex items-center justify-center relative transition-colors duration-500`}>
                        {step !== 2 && (
                            <>
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                                <span className="text-5xl font-bold text-base-content/10 select-none">?</span>
                            </>
                        )}

                        {/* Revealed Character B */}
                        <div
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${step === 2 ? "opacity-100" : "opacity-0"}`}
                            style={{ backgroundImage: `url(${charB.img})` }}
                        />

                        {/* Country Badge (Step 2) */}
                        {step === 2 && (
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium animate-fade-in-up">
                                {charB.name}, {charB.country}
                            </div>
                        )}
                    </div>
                </div>

                {/* Zap Effect (Step 1) */}
                <div
                    className={`
                        absolute z-30 transition-all duration-200 pointer-events-none
                        ${step === 1 ? "scale-150 opacity-100" : "scale-0 opacity-0"}
                    `}
                >
                    <div className="relative">
                        <Zap className="w-20 h-20 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)] animate-shake" />
                        <div className="absolute inset-0 bg-yellow-400/50 blur-2xl rounded-full mix-blend-screen" />
                    </div>
                </div>

                {/* Sparkles (Step 2) */}
                <div
                    className={`
                         absolute -top-6 -right-6 z-40 transition-all duration-500 delay-300
                         ${step === 2 ? "opacity-100 scale-110" : "opacity-0 scale-0"}
                    `}
                >
                    <Sparkles className="w-10 h-10 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-lg" />
                </div>

            </div>

            {/* Rolling Captions - Slot Machine Style */}
            <div className="mt-16 h-16 relative w-full flex justify-center items-center overflow-visible z-20">
                <div className="text-rolling-container h-12">
                    <div
                        className="text-rolling-wrapper"
                        style={{ transform: `translateY(-${captionIndex * 3}rem)` }} // Matching 3rem (h-12) height
                    >
                        {CAPTIONS.map((caption, i) => (
                            <h3
                                key={i}
                                className={`
                                    text-2xl sm:text-3xl font-bold whitespace-nowrap h-12 flex items-center justify-center
                                    ${caption.color}
                                `}
                                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                            >
                                {caption.text}
                            </h3>
                        ))}
                    </div>
                </div>
            </div>


            {/* Supporting Text */}
            <div className="mt-2 text-base-content/50 text-sm font-medium tracking-wide uppercase">
                Click to start your journey
            </div>

        </div>
    );
};

export default LiveMatchAnimation;
