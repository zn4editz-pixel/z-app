import { useEffect, useState, useMemo } from "react";
import { Video, Mic, PhoneOff, MapPin, Send, MessageCircle, Phone, UserPlus, Gamepad2, Heart, Music, Camera } from "lucide-react";
import { CHARACTERS } from "../../constants/characters";

const StrangerAnimation = () => {
    const [step, setStep] = useState(0);
    const [scanIndex, setScanIndex] = useState(0);
    const [matchIndex, setMatchIndex] = useState(1);

    // Conversation State
    const [conversation, setConversation] = useState([]);
    const [chatTopic, setChatTopic] = useState("social");
    const [currentTime, setCurrentTime] = useState("");

    // Dynamic Conversation Database
    const CONVERSATIONS = {
        social: [
            { msg: "Hey! Love your vibe. Where u from?", type: "recv", delay: 800 },
            { msg: "Thanks! I'm from visual land 📍 You?", type: "sent", delay: 1800 },
            { msg: "No way! I was just there last week! 🌎", type: "recv", delay: 1000 }
        ],
        gaming: [
            { msg: "GG on that last match! 🎮", type: "recv", delay: 600 },
            { msg: "Haha thanks, you carried though!", type: "sent", delay: 1500 },
            { msg: "Duo again? I'm free now.", type: "recv", delay: 1200 }
        ],
        flirty: [
            { msg: "Your smile is contagious 😊", type: "recv", delay: 1000 },
            { msg: "Aww stop it 🙈 (don't stop)", type: "sent", delay: 2000 },
            { msg: "Coffee sometime? ☕", type: "recv", delay: 1500 }
        ]
    };

    // Story Captions (Rolling Text Style)
    const storyCaptions = [
        { title: "INSTANT CONNECT", sub: "One click. Zero waiting." },
        { title: "FACE-TO-FACE", sub: "4K Video. Real Vibes." },
        { title: "STRANGERS → FRIENDS", sub: "Make it last." }
    ];

    // Persist "Me" Avatar
    const myAvatar = useMemo(() => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)], []);

    // Random Time Generator
    const getRandomTime = () => {
        const hour = Math.floor(Math.random() * 12) + 1;
        const min = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        const ampm = Math.random() > 0.5 ? "PM" : "AM";
        return `${hour}:${min} ${ampm}`;
    };

    // Initialize time on mount only
    useEffect(() => {
        setCurrentTime(getRandomTime());
    }, []);

    useEffect(() => {
        const loop = setInterval(() => {
            setStep((prev) => {
                const next = (prev + 1) % 3;
                if (next === 0) {
                    // RESET: Start New Match
                    const newMatch = Math.floor(Math.random() * CHARACTERS.length);
                    setMatchIndex(newMatch);
                    setCurrentTime(getRandomTime());

                    // Pick Random Topic
                    const topics = Object.keys(CONVERSATIONS);
                    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                    setChatTopic(randomTopic);
                    setConversation([]); // Clear chat
                }
                return next;
            });
        }, 6000); // Longer cycle for better readability

        return () => clearInterval(loop);
    }, []);

    // Scanning Effect
    useEffect(() => {
        if (step !== 0) return;
        let speed = 50;
        const scanner = () => {
            setScanIndex(prev => (prev + 1) % CHARACTERS.length);
            speed += 15;
            if (speed < 300) setTimeout(scanner, speed);
        };
        scanner();
    }, [step]);

    // Chat Message Sequencer
    useEffect(() => {
        if (step !== 2) return;

        const sequence = CONVERSATIONS[chatTopic];
        let timeouts = [];
        let accumulatedDelay = 0;

        sequence.forEach((msgObj) => {
            accumulatedDelay += msgObj.delay;
            const timeout = setTimeout(() => {
                setConversation(prev => [...prev, { ...msgObj, time: getRandomTime() }]);
            }, accumulatedDelay);
            timeouts.push(timeout);
        });

        return () => timeouts.forEach(clearTimeout);
    }, [step, chatTopic]);

    return (
        <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 w-full h-full relative overflow-hidden font-sans p-8">

            {/* 🌌 ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 bg-base-200 overflow-hidden" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-base-200 to-base-200 opacity-80" />

            {/* 📱 DEVICE FRAME */}
            <div className="relative w-[340px] h-[640px] bg-black rounded-[3rem] shadow-2xl border-4 border-base-content/5 ring-8 ring-black overflow-hidden transform transition-all hover:scale-[1.01] duration-500">

                {/* STATUS BAR */}
                <div className="absolute top-0 left-0 right-0 h-14 z-50 flex justify-between items-center px-6 text-white text-xs font-medium">
                    <span>{currentTime}</span>
                    <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <span>5G</span>
                        <div className="w-6 h-3 bg-white/20 rounded-sm overflow-hidden relative">
                            <div className="absolute inset-0 bg-white w-[80%]" />
                        </div>
                    </div>
                </div>

                {/* === CONTENT SWITCHER === */}

                {/* 1. SCANNING MODE */}
                <div className={`absolute inset-0 bg-gray-900 flex flex-col items-center justify-center transition-opacity duration-500 ${step === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <div className="relative mb-8">
                        {/* Pulse Waves */}
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping delay-300" />

                        <div className="w-32 h-32 rounded-full border-4 border-primary/30 p-1 relative overflow-hidden">
                            <img src={CHARACTERS[scanIndex].img} className="w-full h-full rounded-full object-cover animate-pulse" alt="Scan" />
                        </div>
                        <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                            <span className="bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider shadow-lg">
                                Finding Match
                            </span>
                        </div>
                    </div>
                    <div className="h-8 overflow-hidden relative w-full text-center">
                        <div className="animate-bounce text-white/50 text-sm font-medium">
                            Searching globally...
                        </div>
                    </div>
                </div>

                {/* 2. VIDEO CALL MODE (FULL BLEED) */}
                <div className={`absolute inset-0 bg-gray-900 transition-opacity duration-700 ${step === 1 ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}>
                    <img src={CHARACTERS[matchIndex].img} className="absolute inset-0 w-full h-full object-cover" alt="Partner" />

                    {/* UI Overlays */}
                    <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent pt-16 flex items-start justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-white text-xl font-bold leading-none shadow-sm">{CHARACTERS[matchIndex].name}</h2>
                            <p className="text-white/70 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {CHARACTERS[matchIndex].country}</p>
                        </div>
                        <div className="w-24 h-32 bg-black/50 rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 shadow-lg">
                            <img src={myAvatar.img} className="w-full h-full object-cover opacity-90" alt="Me" />
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-6">
                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20"><Mic className="w-5 h-5" /></button>
                        <button className="w-14 h-14 rounded-full bg-red-500 shadow-xl shadow-red-500/40 flex items-center justify-center text-white transform hover:scale-105 transition-transform"><PhoneOff className="w-6 h-6 fill-current" /></button>
                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20"><Video className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* 3. CHAT MODE */}
                <div className={`absolute inset-0 bg-base-100 flex flex-col transition-all duration-500 ${step === 2 ? 'opacity-100 z-20 translate-x-0' : 'opacity-0 z-0 translate-x-full'}`}>

                    {/* Header */}
                    <div className="h-24 bg-base-100/80 backdrop-blur-md border-b border-base-200 pt-10 px-6 flex items-center gap-4 sticky top-0 z-10">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img src={CHARACTERS[matchIndex].img} className="w-full h-full object-cover" alt="User" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100"></div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-base-content">{CHARACTERS[matchIndex].name}</h3>
                            <p className="text-xs text-primary font-medium">Online</p>
                        </div>
                        <UserPlus className="w-5 h-5 text-primary cursor-pointer hover:scale-110 transition-transform" />
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        <div className="text-center text-[10px] text-base-content/30 my-2 font-bold tracking-widest uppercase">
                            Today {currentTime}
                        </div>

                        {conversation.map((msg, idx) => (
                            <div key={idx} className={`flex w-full ${msg.type === 'sent' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm relative group
                                    ${msg.type === 'sent'
                                        ? 'bg-primary text-primary-content rounded-br-none'
                                        : 'bg-base-200 text-base-content rounded-bl-none'
                                    }`}>
                                    {msg.msg}
                                    <span className={`text-[9px] absolute -bottom-4 ${msg.type === 'sent' ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 text-base-content/50 transition-opacity whitespace-nowrap`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-base-200 bg-base-100 pb-8">
                        <div className="h-10 bg-base-200 rounded-full px-4 flex items-center gap-3">
                            <Camera className="w-4 h-4 text-base-content/40 cursor-pointer hover:text-primary" />
                            <div className="flex-1 text-sm text-base-content/40">Type a message...</div>
                            <Send className="w-4 h-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>

            </div>

            {/* 📝 ROLLING TEXT CAPTIONS (Marketing) */}
            <div className="absolute bottom-12 w-full text-center">
                <div className="h-16 overflow-hidden relative">
                    {storyCaptions.map((cap, i) => (
                        <div key={i} className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700
                            ${step === i ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
                        >
                            <h2 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm">
                                {cap.title}
                            </h2>
                            <p className="text-base-content/60 font-medium tracking-wide mt-1">
                                {cap.sub}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default StrangerAnimation;
