import { useEffect, useState } from "react";
import { MessageSquare, Heart, Send, MessageCircle, User, Smile, Mail, Bell } from "lucide-react";

const ICONS = [MessageSquare, Heart, Send, MessageCircle, User, Smile, Mail, Bell];

const ChatBackground = () => {

    useEffect(() => {
        // Generate random icons with random properties
        const newIcons = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
            left: Math.random() * 100, // 0-100%
            delay: Math.random() * 15, // 0-15s delay
            duration: 15 + Math.random() * 10, // 15-25s duration
            size: 20 + Math.random() * 30, // 20-50px size
            rotation: Math.random() * 360,
        }));
        setIcons(newIcons);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <style>
                {`
                    @keyframes float-up {
                        0% {
                            transform: translateY(110vh) rotate(0deg);
                            opacity: 0;
                        }
                        10% {
                            opacity: 0.15;
                        }
                        90% {
                            opacity: 0.15;
                        }
                        100% {
                            transform: translateY(-20vh) rotate(360deg);
                            opacity: 0;
                        }
                    }
                `}
            </style>

            {/* Gradient Overlay for texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-base-100/80 via-transparent to-base-100/80" />

            {icons.map(({ id, Icon, left, delay, duration, size }) => (
                <div
                    key={id}
                    className="absolute text-base-content/10"
                    style={{
                        left: `${left}%`,
                        fontSize: `${size}px`,
                        animation: `float-up ${duration}s linear infinite`,
                        animationDelay: `-${Math.random() * 20}s`, // Start at random times immediately
                        willChange: "transform, opacity",
                        bottom: "-50px", // Start below screen
                    }}
                >
                    <Icon size={size} strokeWidth={1.5} />
                </div>
            ))}
        </div>
    );
};

export default ChatBackground;
