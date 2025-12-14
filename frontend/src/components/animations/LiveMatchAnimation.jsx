import { useState, useEffect } from "react";
import { User, Zap, Sparkles, Video, Mic, MessageCircle, Heart, UserPlus, Lock } from "lucide-react";
import { CHARACTERS } from "../../constants/characters";

// Rotating Captions
const CAPTIONS = [
    { text: "From Strangers to Friends.", color: "text-primary" },
    { text: "Random Video, Real Vibes.", color: "text-secondary" },
    { text: "One Click, New World.", color: "text-accent" },
    { text: "Find Your Tribe.", color: "text-success" },
    { text: "Connect Across Borders.", color: "text-info" },
];

const LiveMatchAnimation = () => {
    // 0: Floating, 1: Snapping, 2: Video, 3: Friends, 4: Chat
    const [step, setStep] = useState(0);
    const [captionIndex, setCaptionIndex] = useState(0);
    const [charIndexA, setCharIndexA] = useState(0);
    const [charIndexB, setCharIndexB] = useState(1);
    const [messages, setMessages] = useState([]);

    // Main Animation Cycle
    useEffect(() => {
        let isMounted = true;
        const cycle = async () => {
            while (isMounted) {
                // Pick two DIFFERENT random characters for next round
                const idxA = Math.floor(Math.random() * CHARACTERS.length);
                let idxB = Math.floor(Math.random() * CHARACTERS.length);
                while (idxB === idxA) idxB = Math.floor(Math.random() * CHARACTERS.length);

                if (!isMounted) break;
                setCharIndexA(idxA);
                setCharIndexB(idxB);
                setMessages([]); // Clear chat

                // Step 0: Floating independently (2s)
                setStep(0);
                await new Promise(r => setTimeout(r, 2000));

                // Step 1: Snap together (Zap effect) (0.6s)
                if (!isMounted) break;
                setStep(1);
                await new Promise(r => setTimeout(r, 600));

                // Step 2: Video Call / Merged (3s)
                if (!isMounted) break;
                setStep(2);
                await new Promise(r => setTimeout(r, 3000));

                // Step 3: Friend Connection (2s) -> NEW
                if (!isMounted) break;
                setStep(3);
                await new Promise(r => setTimeout(r, 2000));

                // Step 4: Chat Interaction (3.5s)
                if (!isMounted) break;
                setStep(4);

                // Add fake messages sequentially
                setTimeout(() => setMessages(p => [...p, { text: "Hey friend! 👋", align: "left" }]), 500);
                setTimeout(() => setMessages(p => [...p, { text: "Accepted! Let's chat.", align: "right" }]), 1500);

                await new Promise(r => setTimeout(r, 3500));
            }
        };
        cycle();
        return () => { isMounted = false; };
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
                        ${step >= 2 ? "translate-x-0 w-[50%] h-56 rounded-r-none border-r-0 scale-100 z-10 left-1/2 -ml-[50%]" : ""}
                    `}
                >
                    <div className={`flex-1 ${charA.bg} flex items-center justify-center relative backdrop-blur-sm transition-colors duration-500`}>
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 opacity-100"
                            style={{ backgroundImage: `url(${charA.img})` }}
                        />
                        {/* Fake UI Overlay for Video Call */}
                        {step === 2 && (
                            <div className="absolute top-2 left-2 flex gap-1 animate-fade-in-up">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[8px] text-white font-bold tracking-wider">LIVE</span>
                            </div>
                        )}

                        {/* Name Badge */}
                        {step < 2 && (
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
                                {charA.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Card: USER B (Stranger) */}
                <div
                    className={`
                        absolute w-32 h-48 bg-base-200 rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                        ${step === 0 ? "translate-x-20 rotate-6 scale-90 opacity-100 shadow-xl" : ""}
                        ${step === 1 ? "translate-x-0 rotate-0 scale-100 z-10 shadow-[0_0_30px_rgba(255,255,255,0.2)]" : ""}
                        ${step >= 2 ? "translate-x-0 w-[50%] h-56 rounded-l-none border-l-2 border-l-white/20 scale-100 z-10 left-1/2" : ""}
                    `}
                >
                    <div className={`flex-1 ${charB.bg} flex items-center justify-center relative transition-colors duration-500`}>
                        {step < 2 && (
                            <>
                                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                                <span className="text-5xl font-bold text-base-content/10 select-none">?</span>
                            </>
                        )}

                        {/* Revealed Character B */}
                        <div
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}
                            style={{ backgroundImage: `url(${charB.img})` }}
                        />

                        {/* Call Controls Overlay (Step 2) */}
                        {step === 2 && (
                            <div className="absolute bottom-2 right-2 flex gap-1 animate-fade-in-up">
                                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Mic className="w-3 h-3 text-white" />
                                </div>
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                                    <Video className="w-3 h-3 text-white fill-current" />
                                </div>
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

                {/* Step 3: FRIEND SUCCESS */}
                <div
                    className={`
                         absolute z-40 transition-all duration-500 flex flex-col items-center justify-center pointer-events-none
                         ${step === 3 ? "opacity-100 scale-110" : "opacity-0 scale-50"}
                    `}
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-success/20 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-xl mb-2">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-success/30">
                        Friend Added!
                    </div>
                </div>

                {/* Step 4: CHAT (Private) */}
                {step === 4 && (
                    <>
                        {/* Private Badge */}
                        <div className="absolute top-[-20px] z-50 animate-fade-in-down">
                            <div className="flex items-center gap-1 bg-base-100/80 backdrop-blur-md px-3 py-1 rounded-full border border-base-content/10 shadow-sm text-[10px] font-bold">
                                <Lock className="w-3 h-3 text-primary" />
                                Private Chat
                            </div>
                        </div>

                        <div className="absolute inset-0 z-50 flex flex-col justify-center items-center pointer-events-none p-4 mt-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex w-full mb-2 animate-bounce-in ${msg.align === 'left' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`
                                        max-w-[85%] px-3 py-2 rounded-2xl text-[10px] font-medium shadow-lg backdrop-blur-md
                                        ${msg.align === 'left' ? 'bg-base-100/90 text-base-content rounded-tl-none' : 'bg-primary/90 text-primary-content rounded-tr-none'}
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Sparkles (Step 2/3 Entry) */}
                <div
                    className={`
                         absolute -top-6 -right-6 z-40 transition-all duration-500 delay-300
                         ${(step === 2 || step === 3) ? "opacity-100 scale-110" : "opacity-0 scale-0"}
                    `}
                >
                    <Sparkles className="w-10 h-10 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-lg" />
                </div>

            </div>

            {/* Rolling Captions - Slot Machine Style */}
            <div className="mt-16 h-16 relative w-full flex justify-center items-center overflow-visible z-20">
                <div className="text-rolling-container h-[50px] overflow-hidden relative">
                    <div
                        className="text-rolling-wrapper transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateY(-${captionIndex * 50}px)` }} // Exact 50px steps
                    >
                        {CAPTIONS.map((caption, i) => (
                            <h3
                                key={i}
                                className={`
                                    text-2xl sm:text-3xl font-bold whitespace-nowrap h-[50px] flex items-center justify-center leading-[50px]
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
