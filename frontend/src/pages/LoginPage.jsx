import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import toast from "react-hot-toast"; // ✅ FIXED: Import toast
import {
	Eye,
	EyeOff,
	Loader2,
	Lock,
	MessageSquare,
	User,
} from "lucide-react";
import "../styles/login-interaction-fix.css";

const LoginPage = () => {
	const [showPassword, setShowPassword] = useState(false);
	// ✅ CHANGED: Renamed 'email' to 'emailOrUsername'
	const [formData, setFormData] = useState({
		emailOrUsername: "",
		password: "",
	});
	const { login, isLoggingIn } = useAuthStore();

	// ✅ FIXED: Add form validation
	const validateForm = () => {
		if (!formData.emailOrUsername.trim()) {
			toast.error("Email or username is required");
			return false;
		}
		if (!formData.password) {
			toast.error("Password is required");
			return false;
		}
		if (formData.password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return false;
		}
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate before submitting
		if (!validateForm()) return;

		login(formData);
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Left Side - Form */}
			<div className="flex flex-col justify-center items-center p-6 sm:p-12 login-form-container">
				<div className="w-full max-w-md space-y-8">
					{/* Logo */}
					<div className="text-center mb-8">
						<div className="flex flex-col items-center gap-2 group">
							<div
								className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
                                transition-colors"
							>
								<MessageSquare className="w-6 h-6 text-primary" />
							</div>
							<h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
							<p className="text-base-content/60">Sign in to your account</p>
						</div>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* ✅ CHANGED: Email field is now Email/Username field */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Email or Username</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									{/* Replaced Mail icon with User icon */}
									<User className="h-5 w-5 text-base-content/40" />
								</div>
								<input
									type="text" // Changed from 'email' to 'text'
									className={`input input-bordered w-full pl-10`}
									placeholder="Email or Username" // Updated placeholder
									value={formData.emailOrUsername} // Updated value
									onChange={(e) =>
										setFormData({ ...formData, emailOrUsername: e.target.value })
									}
								/>
							</div>
						</div>
						{/* ✅ END OF CHANGES */}

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Password</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									<Lock className="h-5 w-5 text-base-content/40" />
								</div>
								<input
									type={showPassword ? "text" : "password"}
									className={`input input-bordered w-full pl-10`}
									placeholder="Password"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
								/>
								<button
									type="button"
									className="!absolute inset-y-0 right-0 pr-3 flex items-center !z-[102]"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5 text-base-content/40" />
									) : (
										<Eye className="h-5 w-5 text-base-content/40" />
									)}
								</button>
							</div>

							{/* Forgot Password Link */}
							<div className="text-right mt-2">
								<Link
									to="/forgot-password"
									className="text-sm text-primary hover:underline"
								>
									Forgot Password?
								</Link>
							</div>
						</div>

						<button
							type="submit"
							className="btn btn-primary w-full"
							disabled={isLoggingIn}
						>
							{isLoggingIn ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Loading...
								</>
							) : (
								"Sign in"
							)}
						</button>
					</form>

					<div className="text-center">
						<p className="text-base-content/60">
							Don&apos;t have an account?{" "}
							<Link to="/signup" className="link link-primary">
								Create account
							</Link>
						</p>
					</div>
				</div>
			</div>

			{/* Right Side - Image/Pattern */}
			<AuthImagePattern
				title={"Welcome back!"}
				subtitle={
					"Sign in to continue your conversations and catch up with your messages."
				}
			/>
		</div>
	);
};

export default LoginPage;