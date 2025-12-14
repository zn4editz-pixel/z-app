import { useEffect, useState } from "react";
import { MessageCircle, Heart, Globe, User, MessageSquare, MapPin, Video, Phone } from "lucide-react";
import { CHARACTERS } from "../../constants/characters";

const StrangerAnimation = () => {
    const [step, setStep] = useState(0); // 0: Connect, 1: Match, 2: Chat
    const [scanIndex, setScanIndex] = useState(0);
    const [chatTime1, setChatTime1] = useState("10:00 PM");
    const [chatTime2, setChatTime2] = useState("10:00 PM");
    const [chatTime3, setChatTime3] = useState("10:01 PM");

    // Random Time Helper
    const getRandomTime = () => {
        const hour = Math.floor(Math.random() * 12) + 1;
        const min = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        const ampm = Math.random() > 0.5 ? "PM" : "AM";
        return `${hour}:${min} ${ampm}`;
    };

    useEffect(() => {
        // Randomize times on mount
        const t1 = getRandomTime();
        setChatTime1(t1);
        setChatTime2(t1);
        setChatTime3(getRandomTime());
    }, []);

    useEffect(() => {
        const loop = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 5000); // 5s cycle
        return () => clearInterval(loop);
    }, []);

    // Scanning Effect with Deceleration
    useEffect(() => {
        if (step !== 0) return;
        let speed = 50;
        let timeout;
        const scan = () => {
            setScanIndex((prev) => (prev + 1) % CHARACTERS.length);
            speed += 20; // Decelerate
            if (speed < 400) {
                timeout = setTimeout(scan, speed);
            }
        };
        scan();
        return () => clearTimeout(timeout);
    }, [step]);

    // Current matched character
    const match = CHARACTERS[scanIndex];

    return (
        <div className="relative w-full h-full bg-base-200 overflow-hidden flex flex-col items-center justify-center p-6">

            {/* 1. Floating Background Icons (Subtle) */}
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                <MessageCircle className="absolute top-10 left-10 w-12 h-12 text-primary animate-bounce delay-1000" />
                <Heart className="absolute top-1/3 right-20 w-8 h-8 text-secondary animate-pulse" />
                <Globe className="absolute bottom-20 left-1/4 w-16 h-16 text-accent animate-spin-slow" />
                <User className="absolute top-20 right-1/4 w-10 h-10 text-info" />
                <MessageSquare className="absolute bottom-10 right-10 w-14 h-14 text-success animate-bounce" />
                <Video className="absolute top-1/2 left-10 w-8 h-8 text-warning" />
                <Phone className="absolute bottom-1/3 right-1/4 w-6 h-6 text-error" />
            </div>

            {/* 2. Main Content Card */}
            <div className="relative z-10 text-center w-full max-w-sm">

                {/* STEP 0: CONNECTING / SCANNING */}
                <div className={`transition-all duration-500 transform ${step === 0 ? 'scale-100 opacity-100' : 'scale-90 opacity-0 absolute inset-0'}`}>
                    <div className="w-32 h-32 mx-auto mb-6 relative">
                        {/* Radar/Pulse Effect */}
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse delay-75"></div>
                        <img
                            src={match.img}
                            alt="Scanning"
                            className="w-full h-full rounded-full object-cover border-4 border-primary relative z-10"
                        />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Finding Match...</h3>
                    <p className="text-base-content/60">Connecting you globally</p>
                </div>

                {/* STEP 1: MATCH FOUND */}
                <div className={`transition-all duration-500 transform ${step === 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0 absolute inset-0'}`}>
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-success shadow-xl mx-auto">
                            <img src={match.img} alt={match.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-success text-success-content text-xs font-bold px-2 py-1 rounded-full border-2 border-base-100">
                            98% Match
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">It's a Match!</h3>
                    <p className="text-lg text-primary font-medium">{match.name} from {match.country}</p>
                    <div className="mt-4 flex justify-center gap-2 text-sm text-base-content/60">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 2km away</span>
                        <span>•</span>
                        <span>Online now</span>
                    </div>
                </div>

                {/* STEP 2: CHAT SIMULATION */}
                <div className={`transition-all duration-500 transform ${step === 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 absolute inset-0'}`}>
                    <div className="bg-base-100 rounded-2xl shadow-xl p-4 w-full text-left border border-base-300">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4 border-b border-base-200 pb-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img src={match.img} alt={match.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="font-bold text-sm">{match.name}</div>
                                <div className="text-xs text-success flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full"></span> Online
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3 text-sm">
                            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                                <div className="chat chat-start">
                                    <div className="chat-bubble chat-bubble-primary">Hi there! 👋</div>
                                    <div className="chat-footer opacity-50 text-[10px] mt-1">{chatTime1}</div>
                                </div>
                            </div>

                            <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                                <div className="chat chat-end">
                                    <div className="chat-bubble chat-bubble-secondary">Hey! Nice to meet you. Love the vibe!</div>
                                    <div className="chat-footer opacity-50 text-[10px] mt-1">{chatTime2}</div>
                                </div>
                            </div>

                            <div className="animate-fade-in-up" style={{ animationDelay: '1800ms' }}>
                                <div className="chat chat-start">
                                    <div className="chat-bubble chat-bubble-primary">Thanks! 😊 What are you up to?</div>
                                    <div className="chat-footer opacity-50 text-[10px] mt-1">{chatTime3}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StrangerAnimation;
