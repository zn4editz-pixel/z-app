import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

const ConnectionStatus = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [showStatus, setShowStatus] = useState(false);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			setShowStatus(true);
			setTimeout(() => setShowStatus(false), 3000);
		};

		const handleOffline = () => {
			setIsOnline(false);
			setShowStatus(true);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Show status initially if offline
		if (!navigator.onLine) {
			setShowStatus(true);
		}

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (!showStatus) return null;

	return (
		<div
			className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${
				isOnline
					? "bg-green-500 text-white"
					: "bg-red-500 text-white"
			}`}
		>
			{isOnline ? (
				<>
					<Wifi size={20} />
					<span className="font-medium">Back online</span>
				</>
			) : (
				<>
					<WifiOff size={20} />
					<span className="font-medium">No internet connection</span>
				</>
			)}
		</div>
	);
};

export default ConnectionStatus;
