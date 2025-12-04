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
		<header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
			<div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16">
				<div className="flex items-center justify-between h-full">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2">
						<img
							src="/zn4.png"
							alt="Z-APP"
							className="h-8 sm:h-10 w-auto"
						/>
					</Link>

					{/* Navigation Icons */}
					<div className="flex items-center gap-1 sm:gap-2">
						{/* Social Hub / Friend Requests */}
						{authUser && (
							<Link
								to="/discover"
								className="btn btn-ghost btn-sm sm:btn-md btn-circle relative"
								title="Social Hub"
							>
								<Users className="w-4 h-4 sm:w-5 sm:h-5" />
								{pendingReceived.length > 0 && (
									<span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-error text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
										{pendingReceived.length}
									</span>
								)}
							</Link>
						)}

						{/* Admin Dashboard */}
						{isAdmin && (
							<Link
								to="/admin"
								className="btn btn-ghost btn-sm sm:btn-md btn-circle"
								title="Admin Dashboard"
							>
								<LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Settings */}
						<Link
							to="/settings"
							className="btn btn-ghost btn-sm sm:btn-md btn-circle"
							title="Settings"
						>
							<Settings className="w-4 h-4 sm:w-5 sm:h-5" />
						</Link>

						{/* Profile */}
						{authUser && (
							<Link
								to="/profile"
								className="btn btn-ghost btn-sm sm:btn-md btn-circle"
								title="Profile"
							>
								<User className="w-4 h-4 sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Logout */}
						{authUser && (
							<button
								onClick={logout}
								className="btn btn-ghost btn-sm sm:btn-md btn-circle"
								title="Logout"
							>
								<LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
							</button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
