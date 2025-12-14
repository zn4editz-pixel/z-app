import { useEffect, useState, useMemo } from "react";
import { MessageCircle, Heart, Globe, User, MessageSquare, MapPin, Video, Phone, UserPlus, Send, Camera, Sparkles } from "lucide-react";
import { CHARACTERS } from "../../constants/characters";

const StrangerAnimation = () => {
    // Stage 0: Scanning
    // Stage 1: Video Match (Reactions Flowing)
    // Stage 2: Friend Success
    // Stage 3: Chatting
    const [step, setStep] = useState(0);
    const [scanIndex, setScanIndex] = useState(0);
    const [matchIndex, setMatchIndex] = useState(1);

    // Conversation State
    const [conversation, setConversation] = useState([]);

    // Floating Hearts for Stage 1
    const [hearts, setHearts] = useState([]);

    // Random Time Helper
    const getRandomTime = () => {
        const hour = Math.floor(Math.random() * 12) + 1;
        const min = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        const ampm = Math.random() > 0.5 ? "PM" : "AM";
        return `${hour}:${min} ${ampm}`;
    };

    const currentTime = useMemo(() => getRandomTime(), []);

    // Loop the 4-stage narrative
    useEffect(() => {
        const timings = [4000, 5000, 3000, 6000]; // Duration for each step
        let timeout;

        const advance = () => {
            setStep(prev => {
                const next = (prev + 1) % 4; // Cycle 0-3
                // RESET Logic on loop
                if (next === 0) {
                    setMatchIndex(Math.floor(Math.random() * CHARACTERS.length));
                    setConversation([]);
                    setHearts([]);
                }
                return next;
            });
        };

        timeout = setTimeout(advance, timings[step]);
        return () => clearTimeout(timeout);
    }, [step]);

    // Scanning Effect (Stage 0)
    useEffect(() => {
        if (step !== 0) return;
        let speed = 50;
        let timeout;
        const scan = () => {
            setScanIndex((prev) => (prev + 1) % CHARACTERS.length);
            speed += 20;
            if (speed < 400) timeout = setTimeout(scan, speed);
        };
        scan();
        return () => clearTimeout(timeout);
    }, [step]);

    // Heart Generator (Stage 1)
    useEffect(() => {
        if (step !== 1) return;
        const interval = setInterval(() => {
            setHearts(prev => [...prev, {
                id: Date.now(),
                left: Math.random() * 80 + 10 + '%',
                animationDuration: Math.random() * 2 + 1 + 's'
            }]);
        }, 400);
        return () => clearInterval(interval);
    }, [step]);

    // Chat Sequence (Stage 3)
    useEffect(() => {
        if (step !== 3) return;
        const messages = [
            { id: 1, text: "Wait, we're friends now! 🎉", type: "recv", delay: 500 },
            { id: 2, text: "I know! The vibe was too good.", type: "sent", delay: 1500 },
            { id: 3, text: "So... gaming later?", type: "recv", delay: 2500 }
        ];

        let timeouts = [];
        messages.forEach(msg => {
            timeouts.push(setTimeout(() => {
                setConversation(prev => [...prev, msg]);
            }, msg.delay));
        });

        return () => timeouts.forEach(clearTimeout);
    }, [step]);

    const match = CHARACTERS[matchIndex];

    // Story Captions based on step
    const captions = [
        { title: "FIND", sub: "Connecting you globally..." },
        { title: "VIBE", sub: "Real reactions. Real Spark." },
        { title: "BOND", sub: "It's a Match! Friend Added." },
        { title: "CHAT", sub: "Keep the conversation going." }
    ];

    return (
        <div className="relative w-full h-full lg:bg-base-200 overflow-hidden flex flex-col items-center justify-center p-6">

            {/* 1. Device Frame / Card */}
            <div className="relative z-10 w-full max-w-xs aspect-[9/16] max-h-[600px] bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-base-content/10 ring-8 ring-black transform transition-transform duration-700 hover:scale-[1.02]">

                {/* Status Bar */}
                <div className="absolute top-0 w-full h-8 z-50 flex justify-between items-center px-4 pt-2">
                    <span className="text-[10px] text-white/80 font-medium">{currentTime}</span>
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-white/80 rounded-full"></div>
                        <div className="w-1 h-2 bg-white/80 rounded-full mt-1"></div>
                        <div className="w-1 h-1 bg-white/80 rounded-full mt-2"></div>
                    </div>
                </div>

                {/* STAGE 0: SCANNING (Radar) */}
                <div className={`absolute inset-0 bg-gray-900 flex flex-col items-center justify-center transition-all duration-500 ${step === 0 ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                    <div className="relative w-48 h-48">
                        {/* Radar Circles */}
                        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping-slow"></div>
                        <div className="absolute inset-4 border-2 border-primary/50 rounded-full animate-ping-slow delay-75"></div>
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            {/* Rotating Radar Sweep */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/20 to-transparent animate-spin-slow origin-bottom-left"></div>
                        </div>
                        {/* Avatar */}
                        <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-primary z-10 bg-black">
                            <img src={CHARACTERS[scanIndex].img} className="w-full h-full object-cover opacity-80" alt="Scan" />
                        </div>
                    </div>
                    <div className="mt-8 text-primary font-mono tracking-widest text-sm animate-pulse">SCANNING...</div>
                </div>

                {/* STAGE 1: VIDEO CALL (Reactions) */}
                <div className={`absolute inset-0 bg-black transition-all duration-500 ${step === 1 ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                    {/* Main Video */}
                    <img src={match.img} className="w-full h-full object-cover opacity-90" alt="Video" />

                    {/* Own Camera (PIP) */}
                    <div className="absolute top-4 right-4 w-20 h-28 bg-gray-800 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <User className="w-8 h-8 text-white/50" />
                        </div>
                    </div>

                    {/* Floating Hearts Container */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {hearts.map(h => (
                            <Heart
                                key={h.id}
                                className="absolute bottom-20 text-red-500 w-8 h-8 animate-float-up fill-current"
                                style={{ left: h.left, animationDuration: h.animationDuration }}
                            />
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <button className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                            <Phone className="w-5 h-5 text-white fill-current" />
                        </button>
                    </div>
                </div>

                {/* STAGE 2: FRIEND SUCCESS */}
                <div className={`absolute inset-0 bg-base-100 flex flex-col items-center justify-center transition-all duration-500 ${step === 2 ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                    <div className="relative scale-125 mb-6">
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1 relative z-10 bg-base-100">
                            <img src={match.img} className="w-full h-full rounded-full object-cover" alt="Friend" />
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                <UserPlus className="w-4 h-4 text-black" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-center mb-1">It's Official!</h2>
                    <p className="text-sm text-base-content/60 mb-6">{match.name} is now your friend.</p>
                    <button className="btn btn-primary btn-sm rounded-full px-6 gap-2">
                        <MessageSquare className="w-4 h-4" /> Say Hi
                    </button>

                    {/* Confetti simulation with icons */}
                    <Sparkles className="absolute top-1/4 left-10 text-yellow-400 w-6 h-6 animate-pulse" />
                    <Star className="absolute top-1/3 right-10 text-yellow-400 w-4 h-4 animate-spin-slow" />
                </div>

                {/* STAGE 3: CHAT */}
                <div className={`absolute inset-0 bg-base-100 flex flex-col transition-all duration-500 ${step === 3 ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                    {/* Header */}
                    <div className="h-16 border-b border-base-200 flex items-center px-4 gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img src={match.img} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sm">{match.name}</div>
                            <div className="text-[10px] text-primary">Typing...</div>
                        </div>
                        <Video className="w-4 h-4 text-base-content/40" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                        {conversation.map((msg, i) => (
                            <div key={i} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${msg.type === 'sent' ? 'bg-primary text-primary-content rounded-br-none' : 'bg-base-200 text-base-content rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-base-200">
                        <div className="h-8 bg-base-200 rounded-full flex items-center px-3 gap-2">
                            <div className="flex-1 text-[10px] text-base-content/40">Message...</div>
                            <Send className="w-3 h-3 text-primary" />
                        </div>
                    </div>
                </div>

            </div>

            {/* 📝 ROLLING CAPTIONS (User Request) */}
            <div className="absolute bottom-8 w-full text-center h-12 overflow-hidden">
                {captions.map((cap, i) => (
                    <div key={i} className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 transform
                        ${step === i ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                    >
                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {cap.title}
                        </h2>
                        <p className="text-xs font-bold tracking-widest text-base-content/50 uppercase mt-1">
                            {cap.sub}
                        </p>
                    </div>
                ))}
            </div>

        </div>
    );
};

// Helper star component
const Star = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

export default StrangerAnimation;
