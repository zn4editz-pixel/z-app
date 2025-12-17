import { useEffect, useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Monitor, Moon, Sun, LayoutTemplate, Sparkles, Save, Loader2, Check, Eye } from "lucide-react";
import OrbitAnimation from "../animations/OrbitAnimation";
import StrangerAnimation from "../animations/StrangerAnimation";
import LiveMatchAnimation from "../animations/LiveMatchAnimation";
import ConnectAnimation from "../animations/ConnectAnimation";
import { THEMES } from "../../constants";

const AppearancePanel = () => {
    const { settings, fetchSettings, updateSettings, isLoading } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateSettings(localSettings);
        setIsSaving(false);
    };

    const handleSelect = (key, value) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const toggleTheme = (theme) => {
        let currentThemes = localSettings?.allowedThemes === "all" ? THEMES : (localSettings?.allowedThemes || "").split(",");

        // If "all" was selected and we toggle one, we need to convert "all" to explicit list first
        if (localSettings?.allowedThemes === "all") {
            // If untoggling one, exclude it from all
            if (currentThemes.includes(theme)) {
                currentThemes = currentThemes.filter(t => t !== theme);
            } else {
                // Should not happen if it was "all"
            }
        } else {
            if (currentThemes.includes(theme)) {
                currentThemes = currentThemes.filter(t => t !== theme);
            } else {
                currentThemes.push(theme);
            }
        }

        // If all available themes are selected, revert to "all"
        if (currentThemes.length === THEMES.length) {
            handleSelect("allowedThemes", "all");
        } else {
            handleSelect("allowedThemes", currentThemes.join(","));
        }
    };

    const isThemeAllowed = (theme) => {
        if (!localSettings?.allowedThemes || localSettings.allowedThemes === "all") return true;
        return localSettings.allowedThemes.split(",").includes(theme);
    };

    if (isLoading && !localSettings) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header */}
            <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    <Monitor className="w-6 h-6 text-primary" />
                    Appearance & Themes
                </h2>
                <p className="text-base-content/60">Customize visible themes, animations, and seasonal effects.</p>
            </div>

            {/* Animation Selection with Live Preview */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Login Animation */}
                <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutTemplate className="w-5 h-5 text-secondary" />
                        <h3 className="text-lg font-bold">Login Animation</h3>
                    </div>

                    <div className="aspect-video bg-base-300/50 rounded-xl overflow-hidden relative mb-4 border border-base-content/10 shadow-inner">
                        <div className="absolute inset-0 transform scale-[0.6] origin-center pointer-events-none">
                            {localSettings?.loginAnimation === "orbit" && <OrbitAnimation />}
                            {localSettings?.loginAnimation === "stranger" && <StrangerAnimation />}
                            {localSettings?.loginAnimation === "live-match" && <LiveMatchAnimation />}
                            {localSettings?.loginAnimation === "connect" && <ConnectAnimation />}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            Live Preview
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleSelect("loginAnimation", "orbit")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.loginAnimation === "orbit" ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            Orbit
                        </button>
                        <button
                            onClick={() => handleSelect("loginAnimation", "stranger")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.loginAnimation === "stranger" ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            Stranger
                        </button>
                        <button
                            onClick={() => handleSelect("loginAnimation", "live-match")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.loginAnimation === "live-match" ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            Live Match 🚀
                        </button>
                        <button
                            onClick={() => handleSelect("loginAnimation", "connect")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.loginAnimation === "connect" ? "btn-primary" : "btn-ghost border-base-300"}`}
                        >
                            Connect 🔓
                        </button>
                    </div>
                </div>

                {/* Signup Animation */}
                <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutTemplate className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-bold">Signup Animation</h3>
                    </div>

                    <div className="aspect-video bg-base-300/50 rounded-xl overflow-hidden relative mb-4 border border-base-content/10 shadow-inner">
                        <div className="absolute inset-0 transform scale-[0.6] origin-center pointer-events-none">
                            {localSettings?.signupAnimation === "orbit" && <OrbitAnimation />}
                            {localSettings?.signupAnimation === "stranger" && <StrangerAnimation />}
                            {localSettings?.signupAnimation === "live-match" && <LiveMatchAnimation />}
                            {localSettings?.signupAnimation === "connect" && <ConnectAnimation />}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            Live Preview
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleSelect("signupAnimation", "orbit")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.signupAnimation === "orbit" ? "btn-secondary" : "btn-ghost border-base-300"}`}
                        >
                            Orbit
                        </button>
                        <button
                            onClick={() => handleSelect("signupAnimation", "stranger")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.signupAnimation === "stranger" ? "btn-secondary" : "btn-ghost border-base-300"}`}
                        >
                            Stranger
                        </button>
                        <button
                            onClick={() => handleSelect("signupAnimation", "live-match")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.signupAnimation === "live-match" ? "btn-secondary" : "btn-ghost border-base-300"}`}
                        >
                            Live Match 🚀
                        </button>
                        <button
                            onClick={() => handleSelect("signupAnimation", "connect")}
                            className={`btn btn-xs sm:btn-sm ${localSettings?.signupAnimation === "connect" ? "btn-secondary" : "btn-ghost border-base-300"}`}
                        >
                            Connect 🔓
                        </button>
                    </div>
                </div>
            </div>

            {/* Theme Management */}
            <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-500" />
                        <div>
                            <h3 className="text-lg font-bold">Global Default Theme</h3>
                            <p className="text-sm text-base-content/60">This theme will be used for new visitors and incognito windows.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <select
                        className="select select-bordered w-full max-w-xs"
                        value={localSettings?.defaultTheme || "dark"}
                        onChange={(e) => handleSelect("defaultTheme", e.target.value)}
                    >
                        <option disabled>Select a default theme</option>
                        {THEMES.map((theme) => (
                            <option key={theme} value={theme}>
                                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </option>
                        ))}
                    </select>

                    <div className="alert alert-info text-sm">
                        <Monitor className="w-4 h-4" />
                        <span>Selected theme will be the fallback for anyone who hasn't chosen a theme yet.</span>
                    </div>
                </div>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <div>
                            <h3 className="text-lg font-bold">Theme Availability</h3>
                            <p className="text-sm text-base-content/60">Select which themes are available to users.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {THEMES.map((theme) => (
                        <div
                            key={theme}
                            className={`
                                relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
                                ${isThemeAllowed(theme) ? "border-primary bg-primary/5" : "border-base-200 opacity-60 hover:opacity-100"}
                            `}
                            onClick={() => toggleTheme(theme)}
                        >
                            {/* Theme Preview Pill */}
                            <div className="w-full h-12 rounded-lg mb-2 shadow-sm" data-theme={theme}>
                                <div className="w-full h-full flex">
                                    <div className="w-1/3 bg-primary h-full rounded-l-lg"></div>
                                    <div className="w-1/3 bg-secondary h-full"></div>
                                    <div className="w-1/3 bg-base-100 h-full rounded-r-lg"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="capitalize font-medium text-sm">{theme}</span>
                                {isThemeAllowed(theme) && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Seasonal Mode & Preview */}
            <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-warning" />
                            <h3 className="text-lg font-bold">Seasonal Mode</h3>
                        </div>
                        <p className="text-sm text-base-content/60 mb-4">
                            Enable automatic seasonal themes (e.g., Snowfall for Winter).
                            This overrides the user's selected theme on the Login/Signup pages.
                        </p>
                        <input
                            type="checkbox"
                            className="toggle toggle-warning toggle-lg"
                            checked={localSettings?.isSeasonalMode || false}
                            onChange={(e) => handleSelect("isSeasonalMode", e.target.checked)}
                        />
                    </div>

                    {/* Seasonal Preview Box */}
                    <div className="w-full md:w-1/2 aspect-video bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl relative overflow-hidden shadow-2xl border-2 border-white/20 group">
                        {/* Snow Effect Preview */}
                        <div className={`absolute inset-0 transition-opacity duration-700 ${localSettings?.isSeasonalMode ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                            {/* Mock Snow */}
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bg-white rounded-full animate-fall"
                                    style={{
                                        width: Math.random() * 4 + 2 + 'px',
                                        height: Math.random() * 4 + 2 + 'px',
                                        top: -10 + '%',
                                        left: Math.random() * 100 + '%',
                                        animationDuration: Math.random() * 3 + 2 + 's',
                                        animationDelay: Math.random() * 2 + 's'
                                    }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-lg">
                                    Winter Season
                                </h1>
                            </div>
                        </div>

                        {!localSettings?.isSeasonalMode && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <span className="text-white/70 font-bold uppercase tracking-widest border-2 border-white/30 px-4 py-2 rounded-lg">Disabled</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary shadow-xl gap-2 hover:scale-105 transition-transform"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            {/* Use standard style tag to avoid 'jsx' attribute warning */}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) translateX(-10px); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(110vh) translateX(10px); opacity: 0.3; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};

export default AppearancePanel;
