import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useSettingsStore = create((set, get) => ({
    settings: {
        loginAnimation: "orbit",
        signupAnimation: "stranger",
        seasonalTheme: null,
        isSeasonalMode: false,
    },
    isLoading: false,

    fetchSettings: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/settings");
            set({ settings: res.data });
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateSettings: async (newSettings) => {
        try {
            const res = await axiosInstance.put("/settings", newSettings);
            set({ settings: res.data });
            toast.success("Appearance settings updated successfully");
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error(error.response?.data?.error || "Failed to update settings");
        }
    },
}));
