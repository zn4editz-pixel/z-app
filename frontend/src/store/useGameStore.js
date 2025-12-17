import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useGameStore = create((set, get) => ({
    gameState: null, // { board, currentTurn, players, scores, status, winner }
    activeGameId: null,
    isGameOpen: false,
    isFindingMatch: false,

    // Actions
    setGameOpen: (isOpen) => set({ isGameOpen: isOpen }),

    initGame: (gameData) => {
        set({
            gameState: gameData,
            activeGameId: gameData.id,
            isGameOpen: true
        });
    },

    updateGame: (gameData) => {
        set({ gameState: gameData });
    },

    resetGame: () => {
        set({
            gameState: null,
            activeGameId: null,
            isGameOpen: false
        });
    },

    // Socket actions wrappers (implemented in component causing side-effects or here if we pass socket)
    // For simplicity, we just manage state here and components call socket.emit
}));
