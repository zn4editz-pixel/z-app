import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import {
	LayoutDashboard,
	Settings,
	User,
	LogOut,
	Users,
} from "lucide-react";

const Navbar = () => {
	const { logout, authUser } = useAuthStore();
	const { selectedUser } = useChatStore();
	const isAdmin = authUser?.isAdmin;

	const { pendingReceived } = useFriendStore();

	// Hide navbar on mobile when in chat
	if (selectedUser && window.innerWidth < 768) return null;

	return (
		<header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
			<div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 sm:h-16">
				<div className="flex items-center justify-between h-full gap-2 sm:gap-4">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2 flex-shrink-0">
						<img
							src="/zn4.png"
							alt="Z-APP Logo"
							className="h-8 sm:h-10 w-auto object-contain"
						/>
					</Link>

					{/* Spacer */}
					<div className="flex-1"></div>

					{/* Navigation Buttons */}
					<div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
						{/* Discover/Social Hub Button with Badge */}
						{authUser && (
							<Link
								to="/discover"
								className="btn btn-ghost btn-circle btn-xs sm:btn-sm relative"
								aria-label="Social Hub"
							>
								<Users className="w-4 h-4 sm:w-5 sm:h-5" />
								{pendingReceived.length > 0 && (
									<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
										{pendingReceived.length}
									</span>
								)}
							</Link>
						)}

						{isAdmin && (
							<Link
								to="/admin"
								className="btn btn-ghost btn-circle btn-xs sm:btn-sm"
								aria-label="Admin Dashboard"
							>
								<LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
							</Link>
						)}

						<Link
							to="/settings"
							className="btn btn-ghost btn-circle btn-xs sm:btn-sm"
							aria-label="Settings"
						>
							<Settings className="w-4 h-4 sm:w-5 sm:h-5" />
						</Link>

						{authUser && (
							<>
								<Link
									to="/profile"
									className="btn btn-ghost btn-circle btn-xs sm:btn-sm"
									aria-label="My Profile"
								>
									<User className="w-4 h-4 sm:w-5 sm:h-5" />
								</Link>

								<button
									onClick={logout}
									className="btn btn-ghost btn-circle btn-xs sm:btn-sm"
									aria-label="Logout"
								>
									<LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
