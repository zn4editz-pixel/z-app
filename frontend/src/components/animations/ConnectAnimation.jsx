import { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  MessageSquare,
  Video,
  UserPlus,
  Send,
  Hand,
  ThumbsUp,
  ShieldCheck,
} from "lucide-react";
import { CHARACTERS } from "../../constants/characters";
const ConnectAnimation = () => {
  const [stage, setStage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [charA, setCharA] = useState(CHARACTERS[0] || { name: "User A", img: "/avatar.png" });
  const [charB, setCharB] = useState(CHARACTERS[1] || { name: "User B", img: "/avatar.png" });

  // Stages:
  // 0: VIDEO_LOCKED (Two cards, video active, chat locked)
  // 1: UNLOCKING (Button clicked, shockwave)
  // 2: CHAT_ACTIVE (Cards slide out, chat slides in)
  // Characters for this cycle
  const runCycle = async () => {
    // Reset
    setStage(0);
    setMessages([]);
    // Randomize characters
    const idxA = Math.floor(Math.random() * CHARACTERS.length);
    let idxB = Math.floor(Math.random() * CHARACTERS.length);
    while (idxB === idxA) idxB = Math.floor(Math.random() * CHARACTERS.length);
    setCharA(CHARACTERS[idxA]);
    setCharB(CHARACTERS[idxB]);
    // Stage 0: Video Locked (Wait 2.5s)
    await new Promise((r) => setTimeout(r, 2500));
    // Auto-trigger "Add Friend" for the specific "Unlock" moment narrative
    // In a real app user clicks, but for animation loop we simulate interest
    // Stage 1: Unlocking (Shockwave)
    setStage(1);
    await new Promise((r) => setTimeout(r, 800)); // Shockwave duration
    // Stage 2: Chat Active
    setStage(2);
    // Simulate chat flow
    await new Promise((r) => setTimeout(r, 500));
    setMessages((prev) => [
      ...prev,
      { text: "Hey! Nice to meet you! 👋", sender: "other" },
    ]);
    await new Promise((r) => setTimeout(r, 1200));
    setMessages((prev) => [
      ...prev,
      { text: "Same here! Love the vibe.", sender: "me" },
    ]);
    await new Promise((r) => setTimeout(r, 1200));
    setMessages((prev) => [
      ...prev,
      { text: "Accepted the friend request! 🤝", sender: "other" },
    ]);
    // Wait before restarting loop
    await new Promise((r) => setTimeout(r, 3000));
    runCycle();
  };
  useEffect(() => {
    runCycle();
    // Cleanup not strictly necessary for this simple recursive loop logic but good practice
    return () => {};
  }, []);
  return (
    <div className="relative w-full h-full bg-[#121212] overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* BACKGROUND ALIVE */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${stage === 2 ? "bg-base-200" : "bg-[#121212]"}`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      </div>
      {/* STAGE 0 & 1: VIDEO CARDS */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] transform
                ${stage >= 2 ? "scale-110 opacity-0 pointer-events-none" : "scale-100 opacity-100"}
            `}
      >
        {/* Connection Line */}
        <div className="absolute w-1 h-32 bg-white/10 rounded-full"></div>
        {/* Top Card (Character A) */}
        <div className="absolute -translate-y-[110px] w-48 h-32 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={charA.img}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">
            {charA.name}
          </div>
          <div className="absolute top-2 right-2 animate-pulse">
            <Video className="w-4 h-4 text-primary" />
          </div>
        </div>
        {/* Bottom Card (Character B) */}
        <div className="absolute translate-y-[110px] w-48 h-32 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={charB.img}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">
            {charB.name}
          </div>
          <div className="absolute top-2 right-2 animate-bounce">
            <Hand className="w-4 h-4 text-secondary" />
          </div>
        </div>
        {/* CENTER HUB */}
        <div className="absolute z-20 flex flex-col items-center">
          {/* Locked State */}
          <div
            className={`transition-all duration-300 ${stage === 0 ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 mb-2 shadow-xl">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-gray-800/80 backdrop-blur px-3 py-1 rounded-full text-[10px] text-gray-400 font-bold tracking-wider border border-gray-700">
              CHAT LOCKED
            </div>
          </div>
          {/* Unlock Trigger (Simulated Click) */}
          <div
            className={`absolute transition-all duration-300 ${stage === 1 ? "scale-125 opacity-100" : "scale-0 opacity-0"}`}
          >
            <div className="relative">
              {/* Shockwaves */}
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
              <div className="absolute -inset-4 bg-primary/30 rounded-full animate-ping delay-75"></div>
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] z-10">
                <Unlock className="w-8 h-8 text-primary-content" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* STAGE 2: CHAT INTERFACE */}
      <div
        className={`absolute w-full max-w-xs transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)]
                ${stage === 2 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"}
            `}
      >
        <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 overflow-hidden flex flex-col h-[400px]">
          {/* Header */}
          <div className="h-16 bg-base-100 border-b border-base-200 flex items-center px-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={charB.img}
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
              </div>
              <div>
                <div className="text-sm font-bold">{charB.name}</div>
                <div className="text-[10px] text-success font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Encrypted
                </div>
              </div>
            </div>
            <div className="w-8 h-8 bg-base-200 rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 opacity-50" />
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden bg-base-200/50 relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent"></div>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-fade-in-up`}
              >
                <div
                  className={`
                                    max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm
                                    ${
                                      msg.sender === "me"
                                        ? "bg-primary text-primary-content rounded-br-sm"
                                        : "bg-white dark:bg-gray-800 text-base-content rounded-bl-sm border border-base-content/5"
                                    }
                                `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input Area */}
          <div className="p-3 bg-base-100 border-t border-base-200">
            <div className="h-10 bg-base-200 rounded-full flex items-center px-4 gap-2 border border-transparent focus-within:border-primary/50 transition-colors">
              <input
                className="flex-1 bg-transparent text-xs outline-none"
                placeholder="Message..."
                disabled
              />
              <Send className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
        {/* Success Badge */}
        <div className="absolute -top-12 left-0 right-0 flex justify-center">
          <div className="bg-success text-success-content px-4 py-1 rounded-full text-[10px] font-bold shadow-lg animate-bounce flex items-center gap-2">
            <UserPlus className="w-3 h-3" />
            FRIENDSHIP UNLOCKED
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConnectAnimation;
