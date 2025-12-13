import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	MessageSquare,
	User,
	AtSign,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";
import "../styles/login-interaction-fix.css"; // ✅ Added CSS Fix

const SignUpPage = () => {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		email: "",
		password: "",
	});

	const { signup, isSigningUp } = useAuthStore();

	const validateForm = () => {
		if (!formData.fullName.trim()) return toast.error("Full name is required");
		if (!formData.username.trim()) return toast.error("Username is required");
		if (formData.username.length < 3)
			return toast.error("Username must be at least 3 characters");
		if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username))
			return toast.error(
				"Username can only contain letters, numbers, underscores, periods, and hyphens."
			);
		if (!formData.email.trim()) return toast.error("Email is required");
		if (!/\S+@\S+\.\S+/.test(formData.email))
			return toast.error("Invalid email format");
		if (!formData.password) return toast.error("Password is required");
		if (formData.password.length < 6)
			return toast.error("Password must be at least 6 characters");
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const isValid = validateForm();
		if (isValid === true) {
			const dataToSend = {
				...formData,
				username: formData.username.toLowerCase(),
			};
			const success = await signup(dataToSend);
			if (success) navigate("/");
		}
	};

	return (
		<div className="min-h-screen grid lg:grid-cols-2">
			{/* Left Side */}
			<div className="flex flex-col justify-center items-center p-6 sm:p-12 login-form-container relative overflow-hidden">

				{/* 🌟 Lightweight Background Animation */}
				<div className="absolute inset-0 bg-base-100/50 -z-10" />
				<div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 animate-pan-slow pointer-events-none -z-10" />
				<div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-pulse-slow pointer-events-none -z-10" />
				<div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/5 rounded-full blur-[80px] animate-pulse-slow delay-1000 pointer-events-none -z-10" />

				<div className="w-full max-w-md space-y-6 relative z-10">
					{/* Logo / Heading */}
					<div className="text-center mb-6">
						<div className="flex flex-col items-center gap-2 group">
							<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
								{/* ✅ CSS Mask to make PNG take theme color */}
								<div
									className="w-10 h-10 bg-base-content"
									style={{
										maskImage: 'url("/z-app-logo.png")',
										WebkitMaskImage: 'url("/z-app-logo.png")',
										maskSize: 'contain',
										WebkitMaskSize: 'contain',
										maskRepeat: 'no-repeat',
										WebkitMaskRepeat: 'no-repeat',
										maskPosition: 'center',
										WebkitMaskPosition: 'center',
									}}
								/>
							</div>
							<h1 className="text-2xl font-bold mt-2">Create Account</h1>
							<p className="text-base-content/60">
								Get started with your free account
							</p>
						</div>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Full Name */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Full Name</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									<User className="w-5 h-5 text-base-content/40" />
								</div>
								<input
									type="text"
									className="input input-bordered w-full pl-10"
									placeholder="Full Name"
									value={formData.fullName}
									onChange={(e) =>
										setFormData({ ...formData, fullName: e.target.value })
									}
								/>
							</div>
						</div>

						{/* Username */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Username</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									<AtSign className="w-5 h-5 text-base-content/40" />
								</div>
								<input
									type="text"
									className="input input-bordered w-full pl-10"
									placeholder="your_unique_username"
									value={formData.username}
									onChange={(e) =>
										setFormData({ ...formData, username: e.target.value })
									}
								/>
							</div>
						</div>

						{/* Email */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Email</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									<Mail className="w-5 h-5 text-base-content/40" />
								</div>
								<input
									type="email"
									className="input input-bordered w-full pl-10"
									placeholder="example@gmail.com"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
								/>
							</div>
						</div>

						{/* Password */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Password</span>
							</label>
							<div className="relative">
								<div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
									<Lock className="w-5 h-5 text-base-content/40" />
								</div>
								<input
									type={showPassword ? "text" : "password"}
									className="input input-bordered w-full pl-10"
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
										<EyeOff className="w-5 h-5 text-base-content/40" />
									) : (
										<Eye className="w-5 h-5 text-base-content/40" />
									)}
								</button>
							</div>
						</div>

						{/* Submit */}
						<button
							type="submit"
							className="btn btn-primary w-full shadow-lg"
							disabled={isSigningUp}
						>
							{isSigningUp ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Loading...
								</>
							) : (
								"Create Account"
							)}
						</button>
					</form>

					{/* Already have account */}
					<div className="text-center">
						<p className="text-base-content/60">
							Already have an account?{" "}
							<Link to="/login" className="link link-primary font-medium">
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>

			{/* Right Side - Image */}
			<AuthImagePattern
				variant="signup"
				title="Join our community"
				subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
			/>
		</div>
	);
};

export default SignUpPage;