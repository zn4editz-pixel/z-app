import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { User, Mail, ArrowLeft, Loader, Lock, Clock } from "lucide-react";

const ForgotPassword = () => {
	const [step, setStep] = useState(1); // 1: username, 2: OTP, 3: new password
	const [username, setUsername] = useState("");
	const [otp, setOtp] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [maskedEmail, setMaskedEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const navigate = useNavigate();

	// Countdown timer for OTP expiry
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	// Step 1: Send OTP
	const handleSendOTP = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const res = await axiosInstance.post("/auth/forgot-password", { username });
			toast.success(res.data.message);
			setMaskedEmail(res.data.email);
			setCountdown(res.data.expiresIn || 600); // Start countdown (default 10 minutes)
			setStep(2);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send OTP");
		} finally {
			setIsLoading(false);
		}
	};

	// Step 2: Verify OTP
	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		
		if (countdown === 0) {
			toast.error("OTP expired! Please request a new one.");
			return;
		}

		setIsLoading(true);

		try {
			await axiosInstance.post("/auth/verify-reset-otp", { username, otp });
			toast.success("OTP verified!");
			setStep(3);
		} catch (error) {
			toast.error(error.response?.data?.message || "Invalid OTP");
		} finally {
			setIsLoading(false);
		}
	};

	// Step 3: Reset Password
	const handleResetPassword = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			return toast.error("Passwords don't match");
		}

		if (password.length < 6) {
			return toast.error("Password must be at least 6 characters");
		}

		setIsLoading(true);

		try {
			await axiosInstance.post("/auth/reset-password", { username, otp, password });
			toast.success("Password reset successful!");
			navigate("/login");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to reset password");
		} finally {
			setIsLoading(false);
		}
	};

	// Resend OTP
	const handleResendOTP = async () => {
		setIsLoading(true);
		try {
			const res = await axiosInstance.post("/auth/forgot-password", { username });
			toast.success("New OTP sent!");
			setMaskedEmail(res.data.email);
			setCountdown(res.data.expiresIn || 600); // Reset countdown (default 10 minutes)
			setOtp(""); // Clear old OTP
		} catch (error) {
			const errorMsg = error.response?.data?.message || "Failed to send OTP";
			const errorCode = error.response?.data?.error;
			
			if (errorCode === "EMAIL_NOT_CONFIGURED") {
				toast.error("Email service is not set up. Please contact support.");
			} else if (errorCode === "EMAIL_AUTH_FAILED") {
				toast.error("Email authentication error. Please contact support.");
			} else {
				toast.error(errorMsg);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Format countdown time
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
			<div className="w-full max-w-md">
				<div className="bg-base-100 rounded-2xl shadow-xl p-6 sm:p-8">
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<div className="flex justify-center mb-4">
							<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
								{step === 1 && <User className="w-8 h-8 text-primary" />}
								{step === 2 && <Mail className="w-8 h-8 text-primary" />}
								{step === 3 && <Lock className="w-8 h-8 text-primary" />}
							</div>
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold">Reset Password</h1>
						<p className="text-sm sm:text-base text-base-content/60 mt-2">
							{step === 1 && "Enter your username to receive OTP"}
							{step === 2 && "Enter the OTP sent to your email"}
							{step === 3 && "Create your new password"}
						</p>
					</div>

					{/* Step Indicator */}
					<div className="flex justify-center mb-6">
						<ul className="steps steps-horizontal w-full max-w-xs">
							<li className={`step ${step >= 1 ? "step-primary" : ""}`}>Username</li>
							<li className={`step ${step >= 2 ? "step-primary" : ""}`}>OTP</li>
							<li className={`step ${step >= 3 ? "step-primary" : ""}`}>Password</li>
						</ul>
					</div>

					{/* Step 1: Username */}
					{step === 1 && (
						<form onSubmit={handleSendOTP} className="space-y-6">
							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">Username</span>
								</label>
								<input
									type="text"
									className="input input-bordered w-full"
									placeholder="your_username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									autoFocus
								/>
							</div>

							<button
								type="submit"
								className="btn btn-primary w-full"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader className="w-5 h-5 animate-spin" />
										Sending OTP...
									</>
								) : (
									"Send OTP"
								)}
							</button>
						</form>
					)}

					{/* Step 2: OTP */}
					{step === 2 && (
						<form onSubmit={handleVerifyOTP} className="space-y-6">
							<div className="alert alert-info text-sm">
								<Mail className="w-5 h-5 flex-shrink-0" />
								<span>OTP sent to {maskedEmail}</span>
							</div>

							{/* Countdown Timer */}
							<div className={`alert ${countdown > 10 ? 'alert-success' : 'alert-warning'}`}>
								<Clock className="w-5 h-5 flex-shrink-0" />
								<div className="flex-1">
									<span className="font-semibold">Time remaining: {formatTime(countdown)}</span>
									{countdown === 0 && (
										<p className="text-xs mt-1">OTP expired! Click "Resend OTP" below.</p>
									)}
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">Enter 6-Digit OTP</span>
								</label>
								<input
									type="text"
									className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
									placeholder="000000"
									value={otp}
									onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
									maxLength={6}
									required
									autoFocus
									disabled={countdown === 0}
								/>
								<label className="label">
									<span className="label-text-alt">Enter the 6-digit code from your email</span>
								</label>
							</div>

							<button
								type="submit"
								className="btn btn-primary w-full"
								disabled={isLoading || otp.length !== 6 || countdown === 0}
							>
								{isLoading ? (
									<>
										<Loader className="w-5 h-5 animate-spin" />
										Verifying...
									</>
								) : (
									"Verify OTP"
								)}
							</button>

							<button
								type="button"
								onClick={handleResendOTP}
								className="btn btn-ghost btn-sm w-full"
								disabled={isLoading || countdown > 0}
							>
								{countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
							</button>
						</form>
					)}

					{/* Step 3: New Password */}
					{step === 3 && (
						<form onSubmit={handleResetPassword} className="space-y-6">
							<div className="alert alert-success text-sm">
								<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span>OTP verified! Now set your new password.</span>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">New Password</span>
								</label>
								<input
									type="password"
									className="input input-bordered w-full"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoFocus
								/>
								<label className="label">
									<span className="label-text-alt">Minimum 6 characters</span>
								</label>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">Confirm Password</span>
								</label>
								<input
									type="password"
									className="input input-bordered w-full"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
							</div>

							<button
								type="submit"
								className="btn btn-primary w-full"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader className="w-5 h-5 animate-spin" />
										Resetting...
									</>
								) : (
									"Reset Password"
								)}
							</button>
						</form>
					)}

					{/* Back to Login */}
					<div className="mt-6 text-center">
						<Link
							to="/login"
							className="btn btn-ghost btn-sm gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Login
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ForgotPassword;
