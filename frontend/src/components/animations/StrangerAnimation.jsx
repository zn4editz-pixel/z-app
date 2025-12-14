import { useEffect, useState } from "react";
import { Video, Mic, PhoneOff, MapPin, Send, Globe, MessageCircle, Phone, UserPlus, Gamepad2 } from "lucide-react";

const StrangerAnimation = () => {
    const [step, setStep] = useState(0);
    const [scanIndex, setScanIndex] = useState(0);
    const [matchIndex, setMatchIndex] = useState(1);

    // Story-driven captions
    const storyCaptions = [
        { title: "Instant Connect", sub: "One click to spark a conversation with a stranger." },
        { title: "Face-to-Face Magic", sub: "See, hear, and laugh together in 4K resolution." },
        { title: "From Strangers to Friends", sub: "Keep the vibe going in chat and stay connected." }
    ];

    import { CHARACTERS } from "../../constants/characters";

    // Pick a random avatar for "Me" (persistent per session ideally, but random for demo)
    const myAvatar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    useEffect(() => {
        // Main Stage Timer
        const loop = setInterval(() => {
            setStep((prev) => {
                const next = (prev + 1) % 3;
                if (next === 0) {
                    const newMatch = Math.floor(Math.random() * CHARACTERS.length);
                    setMatchIndex(newMatch);
                }
                return next;
            });
        }, 5000);

        // Avatar Browser
        const scanner = setInterval(() => {
            if (step === 0) {
                setScanIndex((prev) => (prev + 1) % CHARACTERS.length);
            }
        }, 200);

        return () => { clearInterval(loop); clearInterval(scanner); };
    }, [step]);

    return (
        <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 w-full h-full relative overflow-hidden font-sans p-8">
            {/* 🔮 Background: "LIQUID AURORA" */}
            <div className="absolute inset-0 bg-base-200 overflow-hidden" />
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-spin-slow duration-[60s] opacity-60" />
            <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent animate-spin-slow duration-[45s] direction-reverse opacity-60" />

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[15%] text-accent/20 animate-bounce duration-[3s]"><MessageCircle className="w-8 h-8" /></div>
                <div className="absolute bottom-[30%] right-[10%] text-primary/20 animate-bounce duration-[4s] delay-1000"><Video className="w-6 h-6" /></div>
                <div className="absolute top-[40%] right-[25%] text-secondary/20 animate-bounce duration-[5s] delay-500"><Globe className="w-10 h-10" /></div>
                <div className="absolute bottom-[15%] left-[20%] text-warning/20 animate-bounce duration-[6s] delay-200"><Phone className="w-7 h-7" /></div>
            </div>

            {/* 📱 Main Container */}
            <div className="relative w-full max-w-[600px] h-full flex flex-col items-center justify-center gap-8 py-12">

                {/* 🎭 THE STAGE */}
                <div className="relative w-full flex-1 flex items-center justify-center perspective-[1000px] min-h-[400px]">

                    {/* STAGE 0: CONNECTING */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 0 ? 'opacity-100 scale-100 blur-none pointer-events-auto' : 'opacity-0 scale-110 blur-sm pointer-events-none'}`}>
                        <div className="relative w-64 h-80">
                            <div className="absolute top-4 left-4 w-full h-full bg-base-300 rounded-3xl opacity-40 rotate-[6deg] transition-transform duration-1000 ease-out" />
                            <div className="absolute top-2 left-2 w-full h-full bg-base-100 rounded-3xl opacity-70 rotate-[3deg] shadow-lg transition-transform duration-1000 ease-out" />
                            <div className="absolute inset-0 bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col overflow-hidden transform transition-all hover:scale-[1.02] duration-500">
                                <div className="flex-1 bg-neutral relative">
                                    <img key={scanIndex} src={CHARACTERS[scanIndex].img} className="w-full h-full object-cover animate-pulse" alt="Scanning" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                        <div className="bg-white/90 text-black px-4 py-1.5 rounded-full text-xs font-bold animate-bounce shadow-lg flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> Finding a match...
                                        </div>
                                    </div>
                                    {/* Scanning Country Badge */}
                                    <div className="absolute bottom-2 left-2 right-2 text-center">
                                        <span className="text-[10px] text-white/50">{CHARACTERS[scanIndex].country}</span>
                                    </div>
                                </div>
                                <div className="h-16 flex items-center justify-center gap-4 bg-base-100">
                                    <div className="w-10 h-10 rounded-full bg-base-200 animate-pulse" />
                                    <div className="w-10 h-10 rounded-full bg-base-200 animate-pulse delay-75" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STAGE 1: VIDEO CALL */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 1 ? 'opacity-100 scale-100 translate-y-0 blur-none' : 'opacity-0 scale-95 translate-y-8 blur-sm pointer-events-none'}`}>
                        <div className="w-full max-w-[320px] aspect-[9/15] bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-base-content/10">
                            <img src={CHARACTERS[matchIndex].img} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" alt="Stranger" />
                            <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start">
                                <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 flex items-center gap-1.5 shdaow-sm">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                                </div>
                                <div className="bg-black/40 backdrop-blur-md text-white p-2 rounded-full"><MapPin className="w-4 h-4" /></div>
                            </div>
                            <div className="absolute top-20 right-6 w-20 h-28 bg-gray-900 rounded-xl border border-white/20 shadow-lg overflow-hidden">
                                <img src={myAvatar.img} className="w-full h-full object-cover" alt="Me" />
                            </div>
                            <div className="absolute bottom-24 left-0 right-0 text-center">
                                <div className="inline-block bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium border border-white/10">
                                    Connected with {CHARACTERS[matchIndex].name} ({CHARACTERS[matchIndex].country})
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-5 px-6">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"><Mic className="w-5 h-5" /></div>
                                <div className="w-14 h-14 rounded-full bg-red-500 shadow-lg shadow-red-500/50 flex items-center justify-center text-white animate-pulse hover:bg-red-600 transition-all cursor-pointer"><PhoneOff className="w-6 h-6 fill-current" /></div>
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"><Video className="w-5 h-5" /></div>
                            </div>
                        </div>
                    </div>

                    {/* STAGE 2: FRIENDS & CHAT */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 2 ? 'opacity-100 scale-100 translate-y-0 blur-none' : 'opacity-0 scale-95 translate-y-12 blur-sm pointer-events-none'}`}>
                        <div className="w-full max-w-[320px] aspect-[9/15] bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 flex flex-col overflow-hidden">
                            <div className="h-20 bg-base-200/50 border-b border-base-300 flex items-center px-6 gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-base-300 overflow-hidden border-2 border-white shadow-sm">
                                        <img src={CHARACTERS[matchIndex].img} className="w-full h-full object-cover" alt="J" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content p-1 rounded-full border-2 border-white">
                                        <UserPlus className="w-3 h-3" />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-base text-base-content">{CHARACTERS[matchIndex].name}</div>
                                    <div className="text-xs text-primary font-medium">You represent friends now!</div>
                                </div>
                            </div>
                            <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-base-100">
                                <div className="text-center text-[10px] text-base-content/40 font-mono my-2">-- TODAY --</div>
                                <div className="flex gap-2 items-end animate-fade-in-up delay-100">
                                    <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shrink-0"><img src={CHARACTERS[matchIndex].img} className="w-full h-full object-cover" alt="J" /></div>
                                    <div className="bg-base-200 p-3 rounded-2xl rounded-bl-none text-sm text-base-content/80 max-w-[80%] shadow-sm">
                                        That video call was so fun! 😂
                                    </div>
                                </div>
                                <div className="flex flex-row-reverse gap-2 items-end animate-fade-in-up delay-500">
                                    <div className="bg-primary text-primary-content p-3 rounded-2xl rounded-br-none text-sm font-medium shadow-md max-w-[80%]">
                                        Totally! We should game sometime.
                                    </div>
                                </div>
                                <div className="flex gap-2 items-end animate-fade-in-up delay-1000">
                                    <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shrink-0"><img src={CHARACTERS[matchIndex].img} className="w-full h-full object-cover" alt="J" /></div>
                                    <div className="bg-base-200 p-3 rounded-2xl rounded-bl-none text-sm text-base-content/80 max-w-[80%] shadow-sm flex items-center gap-2">
                                        <Gamepad2 className="w-4 h-4 opacity-50" /> Let's play now?
                                    </div>
                                </div>
                            </div>
                            <div className="h-16 border-t border-base-200 flex items-center px-4 gap-2 bg-base-50/[0.5]">
                                <div className="flex-1 h-10 bg-base-200 rounded-full px-4 flex items-center text-sm opacity-50">Message...</div>
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"><Send className="w-4 h-4" /></div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* 📝 STORY CAPTIONS */}
                <div className="h-28 text-center z-50 w-full max-w-md flex-shrink-0">
                    <div className="relative h-full w-full">
                        {storyCaptions.map((caption, idx) => (
                            <div
                                key={idx}
                                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform
                            ${step === idx ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-95 blur-sm pointer-events-none'}`}>
                                <h3 className="text-3xl font-black text-base-content mb-2 tracking-tight drop-shadow-sm">
                                    {caption.title}
                                </h3>
                                <p className="text-base-content/60 text-lg font-medium leading-snug">
                                    {caption.sub}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StrangerAnimation;
