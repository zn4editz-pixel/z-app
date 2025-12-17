import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, RefreshCw } from 'lucide-react';
// import { useSocket } from '../../context/SocketContext'; // REMOVED BROKEN IMPORT

const SOSBoard = () => {
    const { gameState, isGameOpen, setGameOpen, updateGame } = useGameStore();
    const { authUser } = useAuthStore();
    const { socket } = useAuthStore(); // Or wherever socket is accessible

    const containerRef = useRef(null);

    // Missing state declarations - fixed
    const [timeLeft, setTimeLeft] = useState(15);
    const [closeTimer, setCloseTimer] = useState(5);
    const [selectedLetter, setSelectedLetter] = useState('S');

    // Timer Logic
    useEffect(() => {
        if (!gameState?.turnExpiresAt || gameState?.status !== 'playing') return;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((gameState.turnExpiresAt - now) / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [gameState?.turnExpiresAt, gameState?.status]);

    // Confetti Animation Effect
    useEffect(() => {
        if (gameState?.winner === authUser?.id && containerRef.current) {
            import('gsap').then(({ default: gsap }) => {
                const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
                for (let i = 0; i < 50; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'absolute w-3 h-3 rounded-full z-50';
                    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.left = '50%';
                    particle.style.top = '50%';
                    containerRef.current.appendChild(particle);

                    const angle = Math.random() * Math.PI * 2;
                    const velocity = 100 + Math.random() * 200;

                    gsap.to(particle, {
                        x: Math.cos(angle) * velocity,
                        y: Math.sin(angle) * velocity,
                        opacity: 0,
                        duration: 1 + Math.random(),
                        ease: "power2.out",
                        onComplete: () => particle.remove()
                    });
                }
            });
        }
    }, [gameState?.winner, authUser?.id]);

    // Auto-close Effect

    useEffect(() => {
        if (gameState?.status === 'finished') {
            const timer = setInterval(() => {
                setCloseTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameOpen(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState?.status, setGameOpen]);

    if (!isGameOpen || !gameState || !authUser) return null;

    const isMyTurn = gameState.currentTurn === authUser?.id;
    const myPlayer = gameState.players[authUser?.id];
    const opponentId = gameState.playerIds.find(id => id !== authUser?.id);
    const opponent = gameState.players[opponentId];

    const handleCellClick = (row, col) => {
        if (!isMyTurn || gameState.board[row][col] || gameState.status !== 'playing') return;

        socket.emit("game:move", {
            gameId: gameState.id,
            row,
            col,
            letter: selectedLetter
        });
    };

    const handleClose = () => {
        setGameOpen(false);
    };

    // Determine cell color
    const getCellColor = (row, col) => {
        const val = gameState.board[row][col];
        if (!val) return "bg-base-200 hover:bg-base-300";
        // Can add logic to highlight winning lines if passed from backend
        return "bg-base-100 text-primary font-bold shadow-inner";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div ref={containerRef} className="bg-base-100 w-[90%] max-w-[320px] sm:max-w-[360px] md:max-w-[400px] rounded-2xl shadow-2xl border border-primary/20 overflow-hidden flex flex-col relative my-auto">

                {/* Header */}
                <div className="p-3 bg-base-200/50 flex justify-between items-center border-b border-base-300">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isMyTurn ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                        <h2 className="font-bold text-sm sm:text-base">SOS Game</h2>
                    </div>
                    <button onClick={handleClose} className="btn btn-ghost btn-xs btn-circle">
                        <X size={16} />
                    </button>
                </div>

                {/* Scores */}
                <div className="flex justify-between px-4 py-2 sm:py-4 bg-gradient-to-b from-base-200/30 to-transparent">
                    <div className={`flex flex-col items-center ${gameState.currentTurn === authUser.id ? "scale-105 text-primary" : "opacity-60"} transition-all duration-300`}>
                        <div className="avatar mb-1 pointer-events-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-current shadow-md">
                                <img src={myPlayer?.profilePic || "/avatar.png"} alt="Me" />
                            </div>
                        </div>
                        <span className="font-bold text-[10px] sm:text-xs">YOU</span>
                        <span className="text-xl sm:text-2xl font-black">{myPlayer?.score || 0}</span>
                    </div>

                    <div className="flex flex-col justify-center items-center px-2">
                        <div className="text-[10px] font-mono opacity-50 mb-1">vs</div>
                        <div className={`badge badge-xs sm:badge-sm mb-2 ${gameState.status === 'playing' ? 'badge-info' : 'badge-ghost'}`}>
                            {gameState.status === 'playing' ? (isMyTurn ? "YOUR TURN" : "THEIR TURN") : "FINISHED"}
                        </div>
                        {/* Timer UI */}
                        {gameState.status === 'playing' && (
                            <div className={`radial-progress text-[10px] font-bold transition-all duration-300 ${timeLeft <= 5 ? "text-error scale-110" : "text-primary"}`}
                                style={{ "--value": (timeLeft / 15) * 100, "--size": "1.5rem" }}>
                                {timeLeft}
                            </div>
                        )}
                    </div>

                    <div className={`flex flex-col items-center ${gameState.currentTurn === opponentId ? "scale-105 text-secondary" : "opacity-60"} transition-all duration-300`}>
                        <div className="avatar mb-1 pointer-events-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-current shadow-md">
                                <img src={opponent?.profilePic || "/avatar.png"} alt="Opponent" />
                            </div>
                        </div>
                        <span className="font-bold text-[10px] sm:text-xs">{opponent?.name || "Opponent"}</span>
                        <span className="text-xl sm:text-2xl font-black">{opponent?.score || 0}</span>
                    </div>
                </div>

                {/* Board */}
                <div className="p-3 sm:p-6 flex-1 flex flex-col items-center justify-center bg-base-100 relative">
                    {/* Game Over Overlay */}
                    {gameState.status !== 'playing' && (
                        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                            <div className={`card w-full max-w-xs shadow-2xl overflow-hidden border-2 ${gameState.winner === authUser.id ? "bg-gradient-to-br from-yellow-100 to-amber-200 border-yellow-400" :
                                gameState.winner === 'draw' ? "bg-base-100 border-base-300" :
                                    "bg-base-100 border-base-200"
                                }`}>
                                <div className="card-body items-center text-center p-4">
                                    {gameState.winner === authUser.id ? (
                                        <>
                                            <div className="text-4xl mb-1 animate-bounce">🏆</div>
                                            <h2 className="card-title text-xl font-black text-amber-600">VICTORY!</h2>
                                            <p className="text-amber-800 text-xs font-medium">You dominated the board!</p>
                                        </>
                                    ) : gameState.winner === 'draw' ? (
                                        <>
                                            <div className="text-4xl mb-1">🤝</div>
                                            <h2 className="card-title text-xl font-black text-base-content">DRAW</h2>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl mb-1 grayscale">💀</div>
                                            <h2 className="card-title text-xl font-black text-base-content/60">DEFEAT</h2>
                                        </>
                                    )}
                                    <p className="text-[10px] opacity-60 mt-1">Closing in {closeTimer}s...</p>
                                    <div className="card-actions mt-3 w-full">
                                        <button onClick={handleClose} className={`btn btn-sm w-full rounded-xl border-none shadow-md ${gameState.winner === authUser.id ? "btn-warning text-white" : "btn-primary"
                                            }`}>
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative grid grid-cols-5 gap-0.5 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] aspect-square mx-auto">
                        {gameState.board.map((row, rIndex) => (
                            row.map((cell, cIndex) => (
                                <button
                                    key={`${rIndex}-${cIndex}`}
                                    onClick={() => handleCellClick(rIndex, cIndex)}
                                    disabled={!!cell || !isMyTurn || gameState.status !== 'playing'}
                                    className={`
                                        rounded-md sm:rounded-lg md:rounded-xl 
                                        text-lg sm:text-xl md:text-2xl lg:text-3xl font-black 
                                        flex items-center justify-center transition-all duration-200 aspect-square shadow-sm
                                        min-h-[48px] sm:min-h-[56px] md:min-h-[64px] relative z-10
                                        ${getCellColor(rIndex, cIndex)}
                                        ${(!cell && isMyTurn) ? "hover:scale-95 cursor-pointer ring-2 ring-primary/20" : ""}
                                    `}
                                >
                                    {cell && (
                                        <span className={`animate-in zoom-in spin-in-12 duration-300 ${cell === 'S' ? "text-primary drop-shadow-md" : "text-secondary drop-shadow-md"}`}>
                                            {cell}
                                        </span>
                                    )}
                                </button>
                            ))
                        ))}

                        {/* Simple Animated Lines Overlay */}
                        {gameState.lines && gameState.lines.length > 0 && (
                            <svg
                                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                                style={{ overflow: 'visible' }}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                {gameState.lines.map((line, i) => {
                                    const x1 = line.start.c * 20 + 10;
                                    const y1 = line.start.r * 20 + 10;
                                    const x2 = line.end.c * 20 + 10;
                                    const y2 = line.end.r * 20 + 10;
                                    const color = line.playerId === authUser.id ? "#10B981" : "#EF4444"; // Green for me, Red for opponent

                                    return (
                                        <line
                                            key={`line-${i}`}
                                            x1={x1} y1={y1}
                                            x2={x2} y2={y2}
                                            stroke={color}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            className="animate-draw-line opacity-80"
                                        />
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 sm:p-6 bg-base-200/50 border-t border-base-300">
                    {gameState.status === 'playing' ? (
                        <div className="flex justify-center gap-4 sm:gap-8">
                            <button
                                onClick={() => setSelectedLetter('S')}
                                className={`btn btn-sm sm:btn-lg w-24 sm:w-32 rounded-full ${selectedLetter === 'S' ? "btn-primary shadow-lg scale-105" : "btn-outline"} transition-all`}
                            >
                                <span className="text-lg sm:text-xl font-bold">S</span>
                            </button>
                            <button
                                onClick={() => setSelectedLetter('O')}
                                className={`btn btn-sm sm:btn-lg w-24 sm:w-32 rounded-full ${selectedLetter === 'O' ? "btn-secondary shadow-lg scale-105" : "btn-outline"} transition-all`}
                            >
                                <span className="text-lg sm:text-xl font-bold">O</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-base-content/50">Game Finished</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SOSBoard;

// Inject CSS for line animation (only once)
// Inject CSS for line animation (only once)
if (typeof document !== 'undefined' && !document.getElementById('sos-line-animation-fixed')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'sos-line-animation-fixed';
    styleSheet.textContent = `
        @keyframes dash {
            from { stroke-dashoffset: 1000; }
            to { stroke-dashoffset: 0; }
        }
        .animate-draw-line {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: dash 0.6s ease-out forwards;
        }
    `;
    document.head.appendChild(styleSheet);
}
