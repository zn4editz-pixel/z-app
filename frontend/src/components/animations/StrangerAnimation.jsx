import { useEffect, useState, useMemo } from "react";
import { CHARACTERS } from "../../constants/characters";
import { Scan, Users, Video, Wifi, Info, ShieldCheck } from "lucide-react";

const StrangerAnimation = () => {
    // Stages: 
    // 0: IDLE (River of Gray Cards)
    // 1: TRIGGER (Two cards gravitating)
    // 2: CONNECTED (Color Burst + Video)
    // 3: EXIT (Float away)
    const [stage, setStage] = useState(0);

    // Specific characters for the match event
    const [matchA, setMatchA] = useState(0);
    const [matchB, setMatchB] = useState(1);

    // Cycle the animation
    useEffect(() => {
        let isMounted = true;

        const runCycle = async () => {
            while (isMounted) {
                // 1. IDLE (The Void) - 3s
                setStage(0);
                // Randomize characters
                setMatchA(Math.floor(Math.random() * CHARACTERS.length));
                let b = Math.floor(Math.random() * CHARACTERS.length);
                while (b === matchA) b = Math.floor(Math.random() * CHARACTERS.length);
                setMatchB(b);

                await new Promise(r => setTimeout(r, 3000));
                if (!isMounted) break;

                // 2. TRIGGER (Gravitate/Scan) - 2s
                setStage(1);
                await new Promise(r => setTimeout(r, 2000));
                if (!isMounted) break;

                // 3. CONNECTED (Burst/Color) - 4s
                setStage(2);
                await new Promise(r => setTimeout(r, 4000));
                if (!isMounted) break;

                // 4. EXIT (Float away) - 1s
                setStage(3);
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        runCycle();

        return () => { isMounted = false; };
    }, []);

    // Helpers to get character data safely
    const char1 = CHARACTERS[matchA % CHARACTERS.length];
    const char2 = CHARACTERS[matchB % CHARACTERS.length];

    return (
        <div className="relative w-full h-full bg-[#1a1a1a] overflow-hidden flex flex-col items-center justify-center font-sans">

            {/* 
        LAYER 1: THE VOID (Background River)
        - Only visible/active in Stage 0
        - Grayscale, Dim
      */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${stage === 0 ? 'opacity-100' : 'opacity-20'}`}>
                {/* Vertical scrolling columns */}
                <div className="flex justify-between px-4 h-full opacity-30 gap-4">
                    {/* Left Column - Slow Up */}
                    <div className="flex flex-col gap-6 animate-scroll-up w-1/3">
                        {[...CHARACTERS, ...CHARACTERS].map((c, i) => (
                            <div key={`l-${i}`} className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10">
                                <img src={c.img} className="w-full h-full object-cover rounded-lg opacity-60" />
                            </div>
                        ))}
                    </div>

                    {/* Middle Column - Slow Down (Staggered) */}
                    <div className="flex flex-col gap-6 animate-scroll-down w-1/3 pt-12">
                        {[...CHARACTERS].reverse().map((c, i) => (
                            <div key={`m-${i}`} className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10">
                                <img src={c.img} className="w-full h-full object-cover rounded-lg opacity-60" />
                            </div>
                        ))}
                    </div>

                    {/* Right Column - Slow Up */}
                    <div className="flex flex-col gap-6 animate-scroll-up w-1/3">
                        {[...CHARACTERS, ...CHARACTERS].slice(2).map((c, i) => (
                            <div key={`r-${i}`} className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10">
                                <img src={c.img} className="w-full h-full object-cover rounded-lg opacity-60" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-transparent to-[#1a1a1a] pointer-events-none"></div>
            </div>

            {/* 
        LAYER 2: THE STAGE (Match Animation)
        - Handles Trigger, Connection, and Exit
      */}
            <div className="relative z-10 w-full max-w-sm h-[500px] flex items-center justify-center">

                {/* SHOCKWAVE BURST (Behind cards) */}
                <div className={`absolute pointer-events-none transition-all duration-700 ease-out 
                ${stage === 2 ? 'opacity-100 scale-150' : 'opacity-0 scale-0'}
            `}>
                    <div className="w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping"></div>
                </div>

                {/* CARD A (Top) */}
                <div className={`absolute w-40 h-56 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl
                ${stage === 0 ? '-translate-y-[150%] rotate-6 grayscale opacity-0' : ''}
                ${stage === 1 ? 'translate-y-[-60%] -rotate-3 grayscale brightness-75 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] opacity-100' : ''}
                ${stage === 2 ? 'translate-y-0 translate-x-[-55%] rotate-0 grayscale-0 brightness-110 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] w-48 h-64 z-20' : ''}
                ${stage === 3 ? '-translate-y-[200%] opacity-0' : ''}
            `}>
                    <img src={char1.img} className="w-full h-full object-cover rounded-xl" />
                    {/* Info Overlay (Visible only in Stage 2) */}
                    <div className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-bold transition-opacity duration-300 ${stage === 2 ? 'opacity-100' : 'opacity-0'}`}>
                        {char1.name}
                    </div>
                </div>

                {/* CARD B (Bottom) */}
                <div className={`absolute w-40 h-56 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl
                ${stage === 0 ? 'translate-y-[150%] -rotate-6 grayscale opacity-0' : ''}
                ${stage === 1 ? 'translate-y-[60%] rotate-3 grayscale brightness-75 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] opacity-100' : ''}
                ${stage === 2 ? 'translate-y-0 translate-x-[55%] rotate-0 grayscale-0 brightness-110 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] w-48 h-64 z-20' : ''}
                ${stage === 3 ? '-translate-y-[200%] opacity-0 delay-75' : ''}
            `}>
                    <img src={char2.img} className="w-full h-full object-cover rounded-xl" />
                    {/* Info Overlay */}
                    <div className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-bold transition-opacity duration-300 ${stage === 2 ? 'opacity-100' : 'opacity-0'}`}>
                        {char2.name}
                    </div>
                </div>

                {/* UI ELEMENTS */}

                {/* 1. SCANNING RETICLE (Stage 1) */}
                <div className={`absolute z-30 transition-all duration-500 ${stage === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <Scan className="w-full h-full text-primary animate-spin-slow" strokeWidth={1} />
                        <div className="absolute text-[10px] text-primary font-mono font-bold tracking-widest animate-pulse">SCAN</div>
                    </div>
                </div>

                {/* 2. CONNECTION BADGE (Stage 2) */}
                <div className={`absolute top-10 z-30 transition-all duration-500 delay-300 flex flex-col items-center gap-2 ${stage === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <div className="bg-primary text-primary-content px-4 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 border-2 border-white/20">
                        <Wifi className="w-4 h-4" />
                        CONNECTED
                    </div>
                    <div className="text-white/50 text-[10px] uppercase tracking-[0.2em]">Private Video Link Engaged</div>
                </div>

                {/* 3. REACTION ICONS (Stage 2) */}
                {stage === 2 && (
                    <>
                        <div className="absolute text-4xl animate-bounce delay-700 right-10 top-1/3">👋</div>
                        <div className="absolute text-4xl animate-pulse delay-1000 left-10 bottom-1/3">😄</div>
                    </>
                )}

            </div>

            {/* FOOTER TEXT */}
            <div className="absolute bottom-8 w-full text-center z-20 pointer-events-none">
                <h2 className={`text-2xl font-black transition-all duration-700 ${stage === 2 ? 'text-primary scale-110' : 'text-gray-600 scale-100'}`}>
                    {stage === 2 ? "THE COLOR OF CONNECTION" : "Finding your match..."}
                </h2>
                <p className="text-white/30 text-xs uppercase tracking-widest mt-1">
                    {stage === 2 ? "100% Real People • 0% Filter" : "Connecting to Global Servers"}
                </p>
            </div>

        </div>
    );
};

export default StrangerAnimation;
