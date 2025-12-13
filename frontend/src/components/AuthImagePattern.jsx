import { useEffect, useState, useMemo } from "react";
import { Video, Mic, PhoneOff, MapPin, Sparkles, Send, Heart, Globe, MessageSquare, Gamepad2, Users, Hand, StickyNote, Smile, MessageCircle, Phone, UserPlus, Zap, Camera, Music, Coffee } from "lucide-react";

const AuthImagePattern = ({ title, subtitle, variant = "signup" }) => {
  // Common State
  // -----------------------------------------------------------------------

  // State for "Stranger" animation (Signup Mode)
  const [step, setStep] = useState(0);
  const [scanIndex, setScanIndex] = useState(0);
  const [matchIndex, setMatchIndex] = useState(1); // Default to first female avatar

  // Story-driven captions tied to steps
  const storyCaptions = [
    { title: "Instant Connect", sub: "One click to spark a conversation with a stranger." },
    { title: "Face-to-Face Magic", sub: "See, hear, and laugh together in 4K resolution." },
    { title: "From Strangers to Friends", sub: "Keep the vibe going in chat and stay connected." }
  ];

  // High-Quality "3D/Pixar" Style Avatars (Local Assets)
  const randomAvatars = [
    "/avatars/male_1.png",
    "/avatars/female_1.png",
    "/avatars/male_2.png",
    "/avatars/female_2.png",
  ];

  const avatarNames = ["Alex", "Sarah", "Mike", "Emily"];

  const myAvatar = "/avatars/male_2.png"; // Me

  // Loops for "Stranger" animation
  useEffect(() => {
    if (variant !== "signup") return;

    // Main Stage Timer (5s for enough time to read)
    const loop = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % 3;
        // When looping back to start, pick a NEW random match
        if (next === 0) {
          const newMatch = Math.floor(Math.random() * randomAvatars.length);
          setMatchIndex(newMatch);
        }
        return next;
      });
    }, 5000);

    // Avatar Browser (Only active during Step 0)
    const scanner = setInterval(() => {
      if (step === 0) {
        setScanIndex((prev) => (prev + 1) % randomAvatars.length);
      }
    }, 200);

    return () => { clearInterval(loop); clearInterval(scanner); };
  }, [variant, step]);


  // -----------------------------------------------------------------------
  // RENDER: LOGIN MODE (Orbit Animation) - UNCHANGED
  // -----------------------------------------------------------------------
  if (variant === "login") {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 w-full h-full relative overflow-hidden font-sans">
        {/* 🌌 Cosmic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-base-200 via-base-300 to-base-100 opacity-50" />
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow" />

        {/* 💫 The Orbiting Social Hub - STANDARD SIZE (Fixed Zoom) */}
        <div className="relative w-full h-full flex items-center justify-center scale-100">
          {/* Core Glow */}
          <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

          {/* 🌟 Central Core with Logo */}
          <div className="relative z-10 w-32 h-32 bg-base-100/50 backdrop-blur-xl rounded-[2rem] border-2 border-white/20 shadow-2xl flex items-center justify-center animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] animate-pulse" />
            <img src="/z-app-logo.png" alt="Logo" className="relative z-10 w-24 h-24 object-contain drop-shadow-2xl animate-pulse" />
          </div>

          {/* 🪐 Orbit Ring 1 (Inner) */}
          <div className="absolute w-[50vh] h-[50vh] border border-base-content/5 rounded-full animate-spin-slow duration-[25s] border-dashed">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
              <MessageSquare className="w-8 h-8 text-secondary" />
            </div>
          </div>

          {/* 🪐 Orbit Ring 2 (Outer) */}
          <div className="absolute w-[80vh] h-[80vh] border border-base-content/5 rounded-full animate-spin-slow duration-[40s] flex items-center justify-center opacity-70">
            <div className="absolute top-1/4 -right-6 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
              <Gamepad2 className="w-8 h-8 text-accent" />
            </div>
            <div className="absolute bottom-1/4 -left-6 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
              <Users className="w-8 h-8 text-success" />
            </div>
            <div className="absolute top-1/2 right-[92%] bg-base-100 p-3 rounded-2xl shadow-xl border border-base-content/10 animate-reverse-spin">
              <Heart className="w-6 h-6 text-error" />
            </div>
          </div>
        </div>

        {/* 📜 Text Content */}
        <div className="absolute bottom-12 left-0 right-0 text-center px-8 z-20">
          <h2 className="text-4xl font-extrabold mb-3 text-base-content tracking-tight">{title}</h2>
          <p className="text-base-content/60 text-lg leading-relaxed max-w-md mx-auto">{subtitle}</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // RENDER: SIGNUP MODE (The "Video -> Friend" Journey) - VIDEO CALL THEME
  // -----------------------------------------------------------------------
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 w-full h-full relative overflow-hidden font-sans p-8">

      {/* 🔮 Background: "LIQUID AURORA" Animation */}
      <div className="absolute inset-0 bg-base-200 overflow-hidden" />

      {/* Aurora Layers - Blending gradients that move independently */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-spin-slow duration-[60s] opacity-60" />
      <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent animate-spin-slow duration-[45s] direction-reverse opacity-60" />

      {/* Floating Particles (Chat/Video/Globe) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] text-accent/20 animate-bounce duration-[3s]"><MessageCircle className="w-8 h-8" /></div>
        <div className="absolute bottom-[30%] right-[10%] text-primary/20 animate-bounce duration-[4s] delay-1000"><Video className="w-6 h-6" /></div>
        <div className="absolute top-[40%] right-[25%] text-secondary/20 animate-bounce duration-[5s] delay-500"><Globe className="w-10 h-10" /></div>
        <div className="absolute bottom-[15%] left-[20%] text-warning/20 animate-bounce duration-[6s] delay-200"><Phone className="w-7 h-7" /></div>
      </div>


      {/* 📱 Main Container */}
      <div className="relative w-full max-w-[600px] h-full flex flex-col items-center justify-center gap-8 py-12">

        {/* 🎭 THE STAGE: Transitions between Search -> Video -> Chat */}
        <div className="relative w-full flex-1 flex items-center justify-center perspective-[1000px] min-h-[400px]">

          {/* STAGE 0: CONNECTING (Shuffling Profiles) */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 0 ? 'opacity-100 scale-100 blur-none pointer-events-auto' : 'opacity-0 scale-110 blur-sm pointer-events-none'}
            `}>
            <div className="relative w-64 h-80">
              {/* Background Cards Stack */}
              <div className="absolute top-4 left-4 w-full h-full bg-base-300 rounded-3xl opacity-40 rotate-[6deg] transition-transform duration-1000 ease-out" />
              <div className="absolute top-2 left-2 w-full h-full bg-base-100 rounded-3xl opacity-70 rotate-[3deg] shadow-lg transition-transform duration-1000 ease-out" />

              {/* Active Main Card */}
              <div className="absolute inset-0 bg-base-100 rounded-3xl shadow-2xl border border-base-content/5 flex flex-col overflow-hidden transform transition-all hover:scale-[1.02] duration-500">
                <div className="flex-1 bg-neutral relative">
                  {/* Cycling Profile Image */}
                  <img key={scanIndex} src={randomAvatars[scanIndex]} className="w-full h-full object-cover animate-pulse" alt="Scanning" />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white/90 text-black px-4 py-1.5 rounded-full text-xs font-bold animate-bounce shadow-lg flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Finding a match...
                    </div>
                  </div>
                </div>
                <div className="h-16 flex items-center justify-center gap-4 bg-base-100">
                  <div className="w-10 h-10 rounded-full bg-base-200 animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-base-200 animate-pulse delay-75" />
                </div>
              </div>
            </div>
          </div>


          {/* STAGE 1: VIDEO CALL (Live Interaction) with RANDOM MATCH */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 1 ? 'opacity-100 scale-100 translate-y-0 blur-none' : 'opacity-0 scale-95 translate-y-8 blur-sm pointer-events-none'}
            `}>
            <div className="w-full max-w-[320px] aspect-[9/15] bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-base-content/10">
              {/* Random Match Video */}
              <img src={randomAvatars[matchIndex]} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" alt="Stranger" />

              {/* UI Overlays */}
              <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 flex items-center gap-1.5 shdaow-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                </div>
                <div className="bg-black/40 backdrop-blur-md text-white p-2 rounded-full"><MapPin className="w-4 h-4" /></div>
              </div>

              {/* My PiP */}
              <div className="absolute top-20 right-6 w-20 h-28 bg-gray-900 rounded-xl border border-white/20 shadow-lg overflow-hidden">
                <img src={myAvatar} className="w-full h-full object-cover" alt="Me" />
              </div>

              {/* Connection Status */}
              <div className="absolute bottom-24 left-0 right-0 text-center">
                <div className="inline-block bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium border border-white/10">
                  Connected with {avatarNames[matchIndex]}
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-5 px-6">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"><Mic className="w-5 h-5" /></div>
                <div className="w-14 h-14 rounded-full bg-red-500 shadow-lg shadow-red-500/50 flex items-center justify-center text-white animate-pulse hover:bg-red-600 transition-all cursor-pointer"><PhoneOff className="w-6 h-6 fill-current" /></div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"><Video className="w-5 h-5" /></div>
              </div>
            </div>
          </div>


          {/* STAGE 2: FRIENDS & CHAT (The Result) */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                 ${step === 2 ? 'opacity-100 scale-100 translate-y-0 blur-none' : 'opacity-0 scale-95 translate-y-12 blur-sm pointer-events-none'}
            `}>
            <div className="w-full max-w-[320px] aspect-[9/15] bg-base-100 rounded-[2rem] shadow-2xl border border-base-300 flex flex-col overflow-hidden">
              {/* Header: New Friend Added */}
              <div className="h-20 bg-base-200/50 border-b border-base-300 flex items-center px-6 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-base-300 overflow-hidden border-2 border-white shadow-sm">
                    <img src={randomAvatars[matchIndex]} className="w-full h-full object-cover" alt="J" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content p-1 rounded-full border-2 border-white">
                    <UserPlus className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-base text-base-content">{avatarNames[matchIndex]}</div>
                  <div className="text-xs text-primary font-medium">You represent friends now!</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-base-100">
                <div className="text-center text-[10px] text-base-content/40 font-mono my-2">-- TODAY --</div>

                {/* Msg 1 */}
                <div className="flex gap-2 items-end animate-fade-in-up delay-100">
                  <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shrink-0"><img src={randomAvatars[matchIndex]} className="w-full h-full object-cover" alt="J" /></div>
                  <div className="bg-base-200 p-3 rounded-2xl rounded-bl-none text-sm text-base-content/80 max-w-[80%] shadow-sm">
                    That video call was so fun! 😂
                  </div>
                </div>

                {/* Msg 2 */}
                <div className="flex flex-row-reverse gap-2 items-end animate-fade-in-up delay-500">
                  <div className="bg-primary text-primary-content p-3 rounded-2xl rounded-br-none text-sm font-medium shadow-md max-w-[80%]">
                    Totally! We should game sometime.
                  </div>
                </div>

                {/* Msg 3 */}
                <div className="flex gap-2 items-end animate-fade-in-up delay-1000">
                  <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shrink-0"><img src={randomAvatars[matchIndex]} className="w-full h-full object-cover" alt="J" /></div>
                  <div className="bg-base-200 p-3 rounded-2xl rounded-bl-none text-sm text-base-content/80 max-w-[80%] shadow-sm flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 opacity-50" /> Let's play now?
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="h-16 border-t border-base-200 flex items-center px-4 gap-2 bg-base-50/[0.5]">
                <div className="flex-1 h-10 bg-base-200 rounded-full px-4 flex items-center text-sm opacity-50">Message...</div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"><Send className="w-4 h-4" /></div>
              </div>
            </div>
          </div>

        </div>

        {/* 📝 STORY CAPTIONS (Fixed Spacing, No Overlap) */}
        <div className="h-28 text-center z-50 w-full max-w-md flex-shrink-0">
          <div className="relative h-full w-full">
            {storyCaptions.map((caption, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform
                            ${step === idx ? 'opacity-100 translate-y-0 scale-100 blur-none' : 'opacity-0 translate-y-8 scale-95 blur-sm pointer-events-none'}
                        `}
              >
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

export default AuthImagePattern;
