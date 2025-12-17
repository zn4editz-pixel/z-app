import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useEffect, useState } from "react";
import {
	LayoutDashboard,
	Settings,
	User,
	Compass,
} from "lucide-react";

const Navbar = () => {
	const { authUser } = useAuthStore();
	const { selectedUser } = useChatStore();
	const isAdmin = authUser?.isAdmin;
	const { pendingReceived } = useFriendStore();
	const { getUnreadAdminCount } = useNotificationStore();
	const location = useLocation();

	// Detect mobile device
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Hide navbar on mobile when in chat mode (only for mobile users)
	const shouldHideOnMobile = isMobile && selectedUser && location.pathname === '/';
	
	if (shouldHideOnMobile) {
		return null;
	}

	// Calculate total Social Hub updates (only unread)
	const unreadAdminCount = getUnreadAdminCount();
	const hasVerificationUpdate = authUser?.verificationRequest?.status && authUser.verificationRequest.status !== "none";
	const totalUpdates = pendingReceived.length + unreadAdminCount + (hasVerificationUpdate ? 1 : 0) + (authUser?.isSuspended ? 1 : 0);

	// Check if current page is active
	const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

	return (
		<header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 shadow-sm">
			<div className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
				<div className="flex items-center justify-between h-full mx-auto">
					{/* Logo */}
					{/* Logo */}
					{/* Logo */}
					<Link to="/" className="flex items-center active:opacity-70 transition" aria-label="Go to home page">
						<div
							className="navbar-logo-adaptive"
							aria-label="Z-APP"
						/>
					</Link>

					{/* Navigation Icons */}
					<div className="flex items-center -space-x-2 sm:space-x-0 sm:gap-1">
						{/* Social Hub / Discover */}
						{authUser && (
							<Link
								to="/discover"
								className={`btn btn-sm btn-circle relative w-9 h-9 min-h-0 sm:w-11 sm:h-11 btn-touch ${isActive('/discover') ? 'btn-active' : 'btn-ghost'
									}`}
								title="Discover & Social Hub"
								aria-label={`Discover and Social Hub${totalUpdates > 0 ? ` (${totalUpdates} updates)` : ''}`}
							>
								<Compass className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
								{totalUpdates > 0 && (
									<span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-lg animate-pulse" aria-label={`${totalUpdates} new updates`}>
										{totalUpdates > 9 ? '9+' : totalUpdates}
									</span>
								)}
							</Link>
						)}

						{/* Admin Dashboard */}
						{isAdmin && (
							<Link
								to="/admin"
								className={`btn btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11 btn-touch ${isActive('/admin') ? 'btn-active' : 'btn-ghost'
									}`}
								title="Admin Dashboard"
								aria-label="Admin Dashboard"
							>
								<LayoutDashboard className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Profile */}
						{authUser && (
							<Link
								to="/profile"
								className={`btn btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11 btn-touch ${isActive('/profile') ? 'btn-active' : 'btn-ghost'
									}`}
								title="Profile"
								aria-label="Profile"
							>
								<User className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
							</Link>
						)}

						{/* Settings */}
						<Link
							to="/settings"
							className={`btn btn-sm btn-circle w-9 h-9 min-h-0 sm:w-11 sm:h-11 btn-touch ${isActive('/settings') ? 'btn-active' : 'btn-ghost'
								}`}
							title="Settings"
							aria-label="Settings"
						>
							<Settings className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
						</Link>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
