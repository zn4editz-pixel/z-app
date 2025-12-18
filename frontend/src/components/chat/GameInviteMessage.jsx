import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  AlertCircle,
  PlayCircle,
  Clock,
  Swords,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useGameStore } from "../../store/useGameStore";
import toast from "react-hot-toast";
const GameInviteMessage = ({ message, onJoin }) => {
  const { authUser } = useAuthStore();
  const isSender = message.senderId === authUser.id;
  const gameId = message.text.replace("GAME_INVITE:", "");
  const { activeGameId, setGameOpen, gameState } = useGameStore();
  const isActiveGame = activeGameId === gameId;
  const [timeLeft, setTimeLeft] = useState(20);
  const [isExpired, setIsExpired] = useState(false);
  useEffect(() => {
    // If game is active, it's not expired
    if (isActiveGame) {
      setIsExpired(false);
      return;
    }
    // Calculate initial time left based on message creation time
    const createdTime = new Date(message.createdAt).getTime();
    const currentTime = Date.now();
    const elapsed = (currentTime - createdTime) / 1000;
    const remaining = Math.max(0, 20 - elapsed);
    setTimeLeft(Math.floor(remaining));
    if (remaining <= 0) setIsExpired(true);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [message.createdAt, isActiveGame]);
  const handleJoin = () => {
    if (isActiveGame) {
      setGameOpen(true);
      return;
    }
    if (isExpired) return;
    if (isSender) return;
    toast.loading("Joining game...", { duration: 2000 });
    onJoin(gameId);
  };
  // Check if it's my turn (for active game)
  const isMyTurn = isActiveGame && gameState?.currentTurn === authUser?.id;
  const myScore =
    (isActiveGame && gameState?.players?.[authUser?.id]?.score) || 0;
  const gameStatus = gameState?.status;
  // --- RENDER ---
  // Active game state - Show live status with player avatars
  if (isActiveGame && gameStatus === "playing") {
    const players = gameState?.players ? Object.values(gameState.players) : [];
    const opponent = players.find((p) => p.id !== authUser?.id) || {};
    const opponentScore = opponent?.score || 0;
    return (
      <div
        className={`relative group max-w-[85%] mb-4 ${isSender ? "ml-auto mr-2" : "mr-auto ml-2"}`}
      >
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-primary/50 shadow-xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
          onClick={() => setGameOpen(true)}
          style={{
            background:
              "linear-gradient(135deg, oklch(var(--p)) 0%, oklch(var(--s)) 100%)",
            minWidth: "260px",
          }}
        >
          <div className="p-3 sm:p-4">
            {/* Header with Live indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Swords size={18} className="text-white" />
                <span className="text-white font-bold text-sm">SOS Battle</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/80 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[10px] font-bold uppercase">
                  LIVE
                </span>
              </div>
            </div>
            {/* Player Avatars with Scores */}
            <div className="flex items-center justify-center gap-4 mb-3">
              {/* You */}
              <div className="flex flex-col items-center">
                <img
                  src={authUser?.profilePic || "/avatar.png"}
                  alt="You"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                />
                <span className="text-white text-lg font-black mt-1">
                  {myScore}
                </span>
                <span className="text-white/70 text-[10px]">You</span>
              </div>
              {/* VS */}
              <div className="text-white/60 font-bold text-xs">VS</div>
              {/* Opponent */}
              <div className="flex flex-col items-center">
                <img
                  src={opponent?.profilePic || "/avatar.png"}
                  alt="Opponent"
                  className="w-10 h-10 rounded-full border-2 border-white/50 shadow-lg"
                />
                <span className="text-white text-lg font-black mt-1">
                  {opponentScore}
                </span>
                <span className="text-white/70 text-[10px]">
                  {opponent?.name || "Opponent"}
                </span>
              </div>
            </div>
            {/* Turn Status + Open Button */}
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold text-white">
                {isMyTurn ? "🎯 YOUR TURN" : "⏳ WAITING"}
              </span>
              <button
                className="px-4 py-2 bg-white text-primary rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setGameOpen(true);
                }}
              >
                <PlayCircle size={14} />
                OPEN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Game finished state
  if (isActiveGame && gameStatus === "finished") {
    const isWinner = gameState?.winner === authUser?.id;
    const isDraw = gameState?.winner === "draw";
    return (
      <div
        className={`relative group max-w-[85%] mb-4 ${isSender ? "ml-auto mr-2" : "mr-auto ml-2"}`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border-2 shadow-xl p-4 ${
            isWinner
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-300"
              : isDraw
                ? "bg-gradient-to-r from-gray-500 to-slate-600 border-gray-400"
                : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg">
                {isWinner ? "🏆 Victory!" : isDraw ? "🤝 Draw" : "😢 Defeated"}
              </div>
              <p className="text-white/80 text-sm">Final Score: {myScore}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Expired invite
  if (isExpired && !isActiveGame) {
    return (
      <div
        className={`relative group max-w-[85%] mb-4 ${isSender ? "ml-auto mr-2" : "mr-auto ml-2"}`}
      >
        <div className="relative overflow-hidden rounded-2xl p-4 bg-base-300 border border-base-content/10 grayscale opacity-60 min-w-[260px]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-base-content/10">
              <AlertCircle size={24} className="text-base-content/50" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base-content/60">Invite Expired</h3>
              <p className="text-xs text-base-content/40">
                This game invite has timed out.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Pending invite (default)
  return (
    <div
      className={`relative group max-w-[85%] mb-4 ${isSender ? "ml-auto mr-2" : "mr-auto ml-2"}`}
    >
      <div
        className={`
                  relative overflow-hidden rounded-2xl p-4 
                  border transition-all duration-300
                  bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-[1.02] cursor-pointer
                  min-w-[260px]
                `}
        onClick={() => !isSender && handleJoin()}
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />
        <div className="flex items-center gap-3 sm:gap-4 relative z-20">
          <div className="p-3 rounded-full backdrop-blur-sm bg-white/20 animate-pulse flex-shrink-0">
            <Gamepad2 size={24} className="text-white fill-current" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg tracking-wide text-white whitespace-nowrap overflow-hidden text-ellipsis">
              Let's Play SOS!
            </h3>
            <p className="text-xs mt-1 text-indigo-100 truncate">
              {isSender
                ? `Waiting... (${timeLeft}s)`
                : `Tap to join • ${timeLeft}s left`}
            </p>
          </div>
          {!isSender && (
            <button
              className="px-3 sm:px-4 py-2 bg-white text-indigo-600 rounded-full font-bold text-xs shadow-lg transform active:scale-95 transition-transform flex-shrink-0 whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
            >
              JOIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default GameInviteMessage;
