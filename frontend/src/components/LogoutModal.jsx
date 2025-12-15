import { LogOut } from "lucide-react";

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl border border-base-300 ring-1 ring-base-content/5 animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorator background */}
                <div className="absolute top-0 w-full h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"></div>

                <div className="relative p-6 flex flex-col items-center text-center">
                    {/* Logo with Glow */}
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                        <img
                            src="/z-logo.png"
                            alt="Logo"
                            className="relative w-full h-full object-contain drop-shadow-2xl"
                        />
                    </div>

                    <h3 className="text-2xl font-bold bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent mb-2">
                        Leaving so soon?
                    </h3>

                    <p className="text-base-content/60 mb-8 font-medium">
                        Are you sure you want to logout from your account?
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost flex-1 font-semibold hover:bg-base-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn btn-error flex-1 font-bold text-white shadow-lg hover:shadow-error/30 hover:scale-105 transition-all"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Bottom stylized border */}
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></div>
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
};

export default LogoutModal;
