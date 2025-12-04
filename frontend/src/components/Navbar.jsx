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

	return (
		<header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 shadow-sm">
			<div className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
				<div className="flex items-center justify-between h-full max-w-7xl mx-auto">
					{/* Logo */}
					<Link to="/" className="flex items-center active:opacity-70 transition">
						<img
							src="/zn4.png"
							alt="Z-APP"
							className="h-8 sm:h-9 w-auto"
						/>
					</Link>

					{/* Navigation Icons */}
					<div className="flex items-center -space-x-2 sm:space-x-0 sm:gap-1">
						{/* Social Hub / Friend Requests */}
						{authUser && (
							<Link
								to="/discover"
								className="btn btn-ghost btn-sm btn-circle relative w-9 h-9 min-h-0 sm:w-11 sm:h-11"
								title="Social Hub"
							>
								<Users className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
								{pendingReceived.length > 0 && (
									<span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-lg animate-pulse">
										{pendingReceived.length > 9 ? '9+' : pendingReceived.length}
									</span>
								)}
							</Link>
						)}

						{/* Admin Dashboard */}
						{isAdmin && (
							<Link
								to="/admin"
								className="btn btn-ghost btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11"
								title="Admin Dashboard"
							>
								<LayoutDashboard className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Settings */}
						<Link
							to="/settings"
							className="btn btn-ghost btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11"
							title="Settings"
						>
							<Settings className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
						</Link>

						{/* Profile */}
						{authUser && (
							<Link
								to="/profile"
								className="btn btn-ghost btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11"
								title="Profile"
							>
								<User className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Logout */}
						{authUser && (
							<button
								onClick={logout}
								className="btn btn-ghost btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11"
								title="Logout"
							>
								<LogOut className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
							</button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
