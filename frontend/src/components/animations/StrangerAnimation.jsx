import { useEffect, useState } from "react";
import { CHARACTERS } from "../../constants/characters";
import { Scan, Wifi, UserPlus, MessageSquare, Send } from "lucide-react";
const StrangerAnimation = () => {
  // Stages:
  // 0: IDLE (River of Gray Cards)
  // 1: TRIGGER (Two cards gravitating)
  // 2: CONNECTED (Color Burst + Video)
  // 3: FRIEND (Success Badge)
  // 4: CHAT (Text bubbles)
  // 5: EXIT (Float away)
  // State management
  const [stage, setStage] = useState(0);
  const [matchA, setMatchA] = useState(0);
  const [matchB, setMatchB] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  // Cycle the animation
  useEffect(() => {
    let isMounted = true;
    const runCycle = async () => {
      while (isMounted) {
        // 1. IDLE (The Void) - 2.5s
        setStage(0);
        setChatMessages([]);
        // Randomize characters
        setMatchA(Math.floor(Math.random() * CHARACTERS.length));
        let b = Math.floor(Math.random() * CHARACTERS.length);
        while (b === matchA) b = Math.floor(Math.random() * CHARACTERS.length);
        setMatchB(b);
        await new Promise((r) => setTimeout(r, 2500));
        if (!isMounted) break;
        // 2. TRIGGER (Gravitate/Scan) - 1.5s
        setStage(1);
        await new Promise((r) => setTimeout(r, 1500));
        if (!isMounted) break;
        // 3. CONNECTED (Burst/Color) - 3s
        setStage(2);
        await new Promise((r) => setTimeout(r, 3000));
        if (!isMounted) break;
        // 4. FRIEND (Success Badge) - 1.5s
        setStage(3);
        await new Promise((r) => setTimeout(r, 1500));
        if (!isMounted) break;
        // 5. CHAT (Messages) - 4s
        setStage(4);
        // Message 1
        await new Promise((r) => setTimeout(r, 500));
        setChatMessages([{ text: "Hey! Love the energy! 👋", sender: "them" }]);
        // Message 2
        await new Promise((r) => setTimeout(r, 1500));
        setChatMessages((prev) => [
          ...prev,
          { text: "Thanks! Nice to meet you too! 😄", sender: "me" },
        ]);
        await new Promise((r) => setTimeout(r, 2000));
        if (!isMounted) break;
        // 6. EXIT (Float away) - 1s
        setStage(5);
        await new Promise((r) => setTimeout(r, 1000));
      }
    };
    runCycle();
    return () => {
      isMounted = false;
    };
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
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${stage === 0 ? "opacity-100" : "opacity-20"}`}
      >
        {/* Vertical scrolling columns */}
        <div className="flex justify-between px-4 h-full opacity-30 gap-4">
          {/* Left Column - Slow Up */}
          <div className="flex flex-col gap-6 animate-scroll-up w-1/3">
            {[...CHARACTERS, ...CHARACTERS].map((c, i) => (
              <div
                key={`l-${i}`}
                className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10"
              >
                <img
                  src={c.img}
                  className="w-full h-full object-cover rounded-lg opacity-60"
                />
              </div>
            ))}
          </div>
          {/* Middle Column - Slow Down (Staggered) */}
          <div className="flex flex-col gap-6 animate-scroll-down w-1/3 pt-12">
            {[...CHARACTERS].reverse().map((c, i) => (
              <div
                key={`m-${i}`}
                className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10"
              >
                <img
                  src={c.img}
                  className="w-full h-full object-cover rounded-lg opacity-60"
                />
              </div>
            ))}
          </div>
          {/* Right Column - Slow Up */}
          <div className="flex flex-col gap-6 animate-scroll-up w-1/3">
            {[...CHARACTERS, ...CHARACTERS].slice(2).map((c, i) => (
              <div
                key={`r-${i}`}
                className="w-full aspect-[3/4] bg-white/5 rounded-xl grayscale brightness-50 backdrop-blur-sm p-1 border border-white/10"
              >
                <img
                  src={c.img}
                  className="w-full h-full object-cover rounded-lg opacity-60"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-transparent to-[#1a1a1a] pointer-events-none"></div>
      </div>
      {/* 
        LAYER 2: THE STAGE (Match Animation)
        - Handles Trigger, Connection, Friend, Chat, and Exit
      */}
      <div className="relative z-10 w-full max-w-sm h-[500px] flex items-center justify-center">
        {/* SHOCKWAVE BURST (Behind cards) */}
        <div
          className={`absolute pointer-events-none transition-all duration-700 ease-out 
                ${stage >= 2 && stage < 5 ? "opacity-100 scale-150" : "opacity-0 scale-0"}
            `}
        >
          <div className="w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping"></div>
        </div>
        {/* VISUAL COMPOSITION */}
        <div
          className={`relative w-full h-full transition-all duration-700
                    ${stage === 4 ? "-translate-y-12" : "translate-y-0"}
                `}
        >
          {/* CARD A (Top) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-40 h-56 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl z-20
                    ${stage === 0 ? "top-[60%] -translate-y-full -rotate-6 grayscale opacity-0" : ""}
                    ${stage === 1 ? "top-[40%] -translate-y-full -rotate-3 grayscale brightness-75 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] opacity-100" : ""}
                    ${stage >= 2 && stage < 5 ? "top-[45%] translate-x-[-70%] -translate-y-1/2 rotate-0 grayscale-0 brightness-110 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] w-36 h-48 sm:w-44 sm:h-60" : ""}
                    ${stage === 5 ? "-top-[20%] opacity-0" : ""}
                `}
          >
            <img
              src={char1.img}
              className="w-full h-full object-cover rounded-xl"
            />
            <div
              className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-bold transition-opacity duration-300 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}
            >
              {char1.name}
            </div>
          </div>
          {/* CARD B (Bottom) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-40 h-56 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl z-20
                    ${stage === 0 ? "top-[150%] -rotate-6 grayscale opacity-0" : ""}
                    ${stage === 1 ? "top-[60%] -translate-y-0 rotate-3 grayscale brightness-75 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] opacity-100" : ""}
                    ${stage >= 2 && stage < 5 ? "top-[45%] translate-x-[70%] -translate-y-1/2 rotate-0 grayscale-0 brightness-110 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] w-36 h-48 sm:w-44 sm:h-60" : ""}
                    ${stage === 5 ? "top-[-20%] opacity-0 delay-75" : ""}
                `}
          >
            <img
              src={char2.img}
              className="w-full h-full object-cover rounded-xl"
            />
            <div
              className={`absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white font-bold transition-opacity duration-300 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}
            >
              {char2.name}
            </div>
          </div>
        </div>
        {/* UI ELEMENTS */}
        {/* 1. FINDING INDICATOR (Stage 1) - Replaces Scan Reticle */}
        <div
          className={`absolute z-30 transition-all duration-500 flex flex-col items-center gap-3 ${stage === 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        >
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-primary animate-ping"></div>
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          </div>
          <div className="text-2xl font-black text-white tracking-wider animate-pulse luxury-gradient-text">
            FINDING...
          </div>
        </div>
        {/* 2. CONNECTION BADGE (Stage 2) */}
        <div
          className={`absolute top-8 z-30 transition-all duration-500 flex flex-col items-center gap-2 ${stage === 2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div className="bg-primary text-primary-content px-4 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 border-2 border-white/20">
            <Wifi className="w-4 h-4" />
            CONNECTED
          </div>
        </div>
        {/* 3. FRIEND BADGE (Stage 3) */}
        <div
          className={`absolute top-8 z-30 transition-all duration-500 flex flex-col items-center gap-2 ${stage === 3 ? "opacity-100 translate-y-0 scale-110" : "opacity-0 -translate-y-4 scale-90"}`}
        >
          <div className="bg-success text-success-content px-5 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 border-2 border-white/20 animate-bounce">
            <UserPlus className="w-5 h-5" />
            FRIEND ADDED!
          </div>
        </div>
        {/* 4. CHAT BUBBLES (Stage 4) */}
        <div
          className={`absolute bottom-4 left-0 right-0 z-40 px-6 space-y-3 transition-opacity duration-500 ${stage === 4 ? "opacity-100" : "opacity-0"}`}
        >
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-fade-in-up`}
            >
              <div
                className={`
                                max-w-[85%] px-4 py-2 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-md
                                ${
                                  msg.sender === "me"
                                    ? "bg-primary text-primary-content rounded-br-sm"
                                    : "bg-base-200/90 text-base-content rounded-bl-sm border border-white/10"
                                }
                            `}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {stage === 4 && chatMessages.length > 0 && (
            <div className="flex justify-center pt-2 gap-2">
              <div className="w-2 h-2 rounded-full bg-base-content/20 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-base-content/20 animate-bounce delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-base-content/20 animate-bounce delay-200"></div>
            </div>
          )}
        </div>
        {/* REACTION ICONS (Stage 2 & 3) */}
        {(stage === 2 || stage === 3) && (
          <>
            <div className="absolute text-4xl animate-bounce delay-700 right-10 top-1/3 z-30">
              👋
            </div>
            <div className="absolute text-4xl animate-pulse delay-1000 left-10 bottom-1/3 z-30">
              😄
            </div>
          </>
        )}
      </div>
      {/* FOOTER TEXT */}
      <div
        className={`absolute bottom-8 w-full text-center z-20 pointer-events-none transition-all duration-500 ${stage === 4 ? "opacity-0" : "opacity-100"}`}
      >
        <h2
          className={`text-2xl font-black transition-all duration-700 ${stage >= 2 ? "text-primary scale-110" : "text-gray-600 scale-100"}`}
        >
          {stage >= 2 ? "THE COLOR OF CONNECTION" : "SEARCHING GLOBAL NETWORK"}
        </h2>
        <p className="text-white/30 text-xs uppercase tracking-widest mt-1">
          {stage >= 2 ? "100% Real People • 0% Filter" : "Connecting..."}
        </p>
      </div>
    </div>
  );
};
export default StrangerAnimation;
