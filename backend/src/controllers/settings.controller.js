import { prisma } from "../lib/db.js";

// Get current system settings
export const getSettings = async (req, res) => {
    try {
        // Find the singleton settings record
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default_settings" },
        });

        // If not found, create default
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: "default_settings",
                    loginAnimation: "orbit",
                    signupAnimation: "stranger",
                    isSeasonalMode: false,
                    defaultTheme: "dark", // Default value
                },
            });
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error.message);
        // FAILSAFE: Return default settings if DB fails, so frontend doesn't break
        res.status(200).json({
            id: "default_settings",
            loginAnimation: "orbit",
            signupAnimation: "stranger",
            isSeasonalMode: false,
            defaultTheme: "dark",
            allowedThemes: "all"
        });
    }
};

// Update settings (Admin only)
export const updateSettings = async (req, res) => {
    try {
        const { loginAnimation, signupAnimation, seasonalTheme, isSeasonalMode, defaultTheme, allowedThemes } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default_settings" },
            update: {
                loginAnimation,
                signupAnimation,
                seasonalTheme,
                isSeasonalMode,
                defaultTheme,
                allowedThemes,
                updatedBy: req.user.id,
            },
            create: {
                id: "default_settings",
                loginAnimation,
                signupAnimation,
                seasonalTheme,
                isSeasonalMode,
                defaultTheme,
                allowedThemes,
                updatedBy: req.user.id,
            },
        });

        res.status(200).json(settings);
    } catch (error) {
        console.error("Error updating settings:", error.message);
        res.status(500).json({ error: "Failed to update settings" });
    }
};
