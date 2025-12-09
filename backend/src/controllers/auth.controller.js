import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../lib/cloudinary.js";
import prisma from "../lib/prisma.js";
import { generateToken } from "../lib/utils.js";
import sendEmail from "../utils/sendEmail.js";
import { getLocationData, getClientIP } from "../utils/geoLocation.js";

// ─── Signup ─────────────────────────────────────────────
export const signup = async (req, res) => {
	const { fullName, email, password, username, bio, profilePic } = req.body;
	console.log("Signup request body:", req.body);

	try {
		if (!fullName || !email || !password || !username) {
			return res.status(400).json({ message: "Full name, email, username, and password are required." });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long." });
		}

		const existingUserByEmail = await prisma.user.findUnique({ 
			where: { email } 
		});
		if (existingUserByEmail) {
			return res.status(409).json({ message: "Email is already registered." });
		}

		const existingUserByUsername = await prisma.user.findUnique({ 
			where: { username: username.toLowerCase() } 
		});
		if (existingUserByUsername) {
			return res.status(409).json({ message: "Username is already taken." });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		let uploadedProfilePic = "";
		if (profilePic) {
			try {
				const uploadResult = await cloudinary.uploader.upload(profilePic);
				uploadedProfilePic = uploadResult.secure_url;
			} catch (uploadError) {
				console.error("Cloudinary upload error:", uploadError);
				return res.status(500).json({ message: "Failed to upload profile picture." });
			}
		} else {
			// Generate a unique default avatar using DiceBear API
			uploadedProfilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
		}

		// Detect user location from IP
		const clientIP = getClientIP(req);
		const locationData = await getLocationData(clientIP);

		const newUser = await prisma.user.create({
			data: {
				fullName,
				email,
				username: username.toLowerCase(),
				nickname: fullName, // Default nickname
				bio: bio || "",
				password: hashedPassword,
				profilePic: uploadedProfilePic,
				country: locationData.country,
				countryCode: locationData.countryCode,
				city: locationData.city,
				region: locationData.region || '',
				timezone: locationData.timezone || '',
				isVPN: locationData.isVPN || false,
				lastIP: clientIP
			}
		});

		const token = generateToken(newUser.id, res);

		res.status(201).json({
			token, // Return token for mobile apps
			id: newUser.id,
			fullName: newUser.fullName,
			email: newUser.email,
			username: newUser.username,
			nickname: newUser.nickname,
			bio: newUser.bio,
			profilePic: newUser.profilePic,
			hasCompletedProfile: newUser.hasCompletedProfile,
			isAdmin: newUser.email === process.env.ADMIN_EMAIL,
			isBlocked: newUser.isBlocked,
			isSuspended: newUser.isSuspended,
			isVerified: newUser.isVerified,
			isOnline: newUser.isOnline,
			createdAt: newUser.createdAt,
			country: newUser.country,
			countryCode: newUser.countryCode,
			city: newUser.city,
		});
	} catch (error) {
		console.error("Signup Error:", error);
		if (error.name === "ValidationError") {
			return res.status(400).json({ message: error.message });
		}
		res.status(500).json({ message: "Signup failed. Please try again later." });
	}
};

// ─── Login ─────────────────────────────────────────────
export const login = async (req, res) => {
	const { emailOrUsername, password } = req.body;

	try {
		if (!emailOrUsername || !password) {
			return res.status(400).json({ message: "Email/Username and password are required." });
		}

		// Try to find user by email first, then by username
		let user = await prisma.user.findUnique({
			where: { email: emailOrUsername }
		});

		if (!user) {
			user = await prisma.user.findUnique({
				where: { username: emailOrUsername.toLowerCase() }
			});
		}

		if (!user) return res.status(401).json({ message: "Invalid credentials." });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

		if (user.isBlocked) return res.status(403).json({ message: "Your account is blocked." });
		if (user.isSuspended) return res.status(403).json({ message: "Your account is suspended." });

		// Update user location on login
		const clientIP = getClientIP(req);
		const locationData = await getLocationData(clientIP);
		
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				country: locationData.country,
				countryCode: locationData.countryCode,
				city: locationData.city,
				region: locationData.region || '',
				timezone: locationData.timezone || '',
				isVPN: locationData.isVPN || false,
				lastIP: clientIP
			}
		});

		const token = generateToken(updatedUser.id, res);

		res.status(200).json({
			token, // Return token for mobile apps
			id: updatedUser.id,
			fullName: updatedUser.fullName,
			email: updatedUser.email,
			username: updatedUser.username,
			nickname: updatedUser.nickname,
			bio: updatedUser.bio,
			profilePic: updatedUser.profilePic,
			hasCompletedProfile: updatedUser.hasCompletedProfile,
			isAdmin: updatedUser.email === process.env.ADMIN_EMAIL,
			isBlocked: updatedUser.isBlocked,
			isSuspended: updatedUser.isSuspended,
			isVerified: updatedUser.isVerified,
			isOnline: updatedUser.isOnline,
			createdAt: updatedUser.createdAt,
			country: updatedUser.country,
			countryCode: updatedUser.countryCode,
			city: updatedUser.city,
		});
	} catch (error) {
		console.error("Login Error:", error);
		res.status(500).json({ message: "Login failed. Please try again later." });
	}
};

// ─── Logout ─────────────────────────────────────────────
// --- *** THIS FUNCTION IS NOW FIXED *** ---
export const logout = (req, res) => {
	try {
        // The options to clear the cookie MUST match the options
        // used in generateToken.js
		res.cookie("jwt", "", {
            httpOnly: true,
            expires: new Date(0), // Set expiry to a past date
            
            // Use the same conditional logic as generateToken
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });
		res.status(200).json({ message: "Logged out successfully." });
	} catch (error) {
		console.error("Logout Error:", error);
		res.status(500).json({ message: "Logout failed. Please try again." });
	}
};
// --- *** END OF FIXED FUNCTION *** ---

// --- NEW FUNCTION FOR ONBOARDING ---
export const completeProfileSetup = async (req, res) => {
	try {
		const { nickname, bio, profilePic } = req.body;
		const userId = req.user.id;

		if (!nickname) {
			return res.status(400).json({ message: "Nickname is required." });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		let uploadedProfilePic = user.profilePic;
		if (profilePic) {
			try {
				const uploadResult = await cloudinary.uploader.upload(profilePic);
				uploadedProfilePic = uploadResult.secure_url;
			} catch (uploadError) {
				console.error("Cloudinary upload error:", uploadError);
				return res.status(500).json({ message: "Failed to upload profile picture." });
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				nickname,
				bio: bio || "",
				profilePic: uploadedProfilePic,
				hasCompletedProfile: true
			}
		});

		// Remove password from response
		const { password, ...userWithoutPassword } = updatedUser;

		res.status(200).json(userWithoutPassword);
	} catch (error) {
		console.error("Complete Profile Setup Error:", error);
		res.status(500).json({ message: "Failed to update profile." });
	}
};

// ─── Update Profile Picture ─────────────────────────────────────
export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body;
		const userId = req.user.id;

		if (!profilePic) {
			return res.status(400).json({ message: "Profile picture is required." });
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic);
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { profilePic: uploadResponse.secure_url },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				hasCompletedProfile: true,
				isVerified: true,
				isOnline: true,
				country: true,
				countryCode: true,
				city: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.status(200).json(updatedUser);
	} catch (error) {
		console.error("Update Profile Error:", error);
		res.status(500).json({ message: "Failed to update profile picture." });
	}
};

// ─── Update Profile Info (fullName, nickname, bio) ─────────────────────────────────────
export const updateProfileInfo = async (req, res) => {
	try {
		const { fullName, nickname, bio } = req.body;
		const userId = req.user.id;

		const updateData = {};
		if (fullName !== undefined) updateData.fullName = fullName;
		if (nickname !== undefined) updateData.nickname = nickname;
		if (bio !== undefined) updateData.bio = bio;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				hasCompletedProfile: true,
				isVerified: true,
				isOnline: true,
				country: true,
				countryCode: true,
				city: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.status(200).json(updatedUser);
	} catch (error) {
		console.error("Update Profile Info Error:", error);
		res.status(500).json({ message: "Failed to update profile information." });
	}
};

// ─── Check Username Availability ─────────────────────────────────────
export const checkUsernameAvailability = async (req, res) => {
	try {
		const { username } = req.params;
		const userId = req.user.id;

		// Check if username is valid format
		if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
			return res.status(400).json({ 
				available: false, 
				message: "Username must be 3-20 characters (letters, numbers, underscore only)" 
			});
		}

		// Check if username is taken by another user
		const existingUser = await prisma.user.findFirst({ 
			where: {
				username: username.toLowerCase(),
				NOT: { id: userId } // Exclude current user
			}
		});

		if (existingUser) {
			return res.status(200).json({ 
				available: false, 
				message: "Username is already taken" 
			});
		}

		res.status(200).json({ 
			available: true, 
			message: "Username is available" 
		});
	} catch (error) {
		console.error("Check Username Error:", error);
		res.status(500).json({ message: "Failed to check username availability." });
	}
};

// ─── Update Username ─────────────────────────────────────
export const updateUsername = async (req, res) => {
	try {
		const { username } = req.body;
		const userId = req.user.id;

		if (!username) {
			return res.status(400).json({ message: "Username is required." });
		}

		// Validate username format
		if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
			return res.status(400).json({ 
				message: "Username must be 3-20 characters (letters, numbers, underscore only)" 
			});
		}

		// Check if username is already taken
		const existingUser = await prisma.user.findFirst({ 
			where: {
				username: username.toLowerCase(),
				NOT: { id: userId }
			}
		});

		if (existingUser) {
			return res.status(400).json({ message: "Username is already taken." });
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { username: username.toLowerCase() },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				hasCompletedProfile: true,
				isVerified: true,
				isOnline: true,
				country: true,
				countryCode: true,
				city: true,
				createdAt: true,
				updatedAt: true
			}
		});

		res.status(200).json(updatedUser);
	} catch (error) {
		console.error("Update Username Error:", error);
		res.status(500).json({ message: "Failed to update username." });
	}
};

// ─── Check Auth ─────────────────────────────────────────
export const checkAuth = async (req, res) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
				id: true,
				fullName: true,
				email: true,
				username: true,
				nickname: true,
				bio: true,
				profilePic: true,
				hasCompletedProfile: true,
				isBlocked: true,
				isSuspended: true,
				isVerified: true,
				isOnline: true,
				country: true,
				countryCode: true,
				city: true,
				createdAt: true
			}
		});
		if (!user) return res.status(404).json({ message: "User not found." });

		res.status(200).json({
			id: user.id,
			fullName: user.fullName,
			email: user.email,
			username: user.username,
			nickname: user.nickname,
			bio: user.bio,
			profilePic: user.profilePic,
			hasCompletedProfile: user.hasCompletedProfile,
			isAdmin: user.email === process.env.ADMIN_EMAIL,
			isBlocked: user.isBlocked,
			isSuspended: user.isSuspended,
			isVerified: user.isVerified,
			isOnline: user.isOnline,
			createdAt: user.createdAt,
			country: user.country,
			countryCode: user.countryCode,
			city: user.city,
		});
	} catch (error) {
		console.error("Check Auth Error:", error);
		res.status(500).json({ message: "Failed to verify authentication." });
	}
};

// ─── Forgot Password (Send OTP) ─────────────────────────────────────
export const forgotPassword = async (req, res) => {
	const { username } = req.body;

	try {
		if (!username) {
			return res.status(400).json({ message: "Username is required" });
		}

		// Find user by username
		const user = await prisma.user.findUnique({ 
			where: { username: username.toLowerCase() } 
		});
		if (!user) {
			return res.status(404).json({ message: "No account with that username" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Save OTP to user (expires in 10 minutes)
		await prisma.user.update({
			where: { id: user.id },
			data: {
				resetPasswordToken: otp,
				resetPasswordExpire: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
			}
		});

		// Send OTP via email with Z-APP branding
		const message = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Password Reset OTP - Z-APP</title>
			</head>
			<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
				<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
					<tr>
						<td align="center">
							<table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
								<!-- Header with Logo -->
								<tr>
									<td style="padding: 40px 40px 30px; text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
										<div style="background: white; width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
											<span style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Z</span>
										</div>
										<h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Z-APP</h1>
										<p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Connect. Chat. Discover.</p>
									</td>
								</tr>
								
								<!-- Content -->
								<tr>
									<td style="padding: 40px; background-color: white;">
										<div style="text-align: center; margin-bottom: 30px;">
											<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
												<span style="font-size: 30px;">🔐</span>
											</div>
											<h2 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 700;">Password Reset</h2>
										</div>
										
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px;">
											Hi <strong style="color: #1e293b;">${user.fullName || user.username}</strong>,
										</p>
										
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 30px;">
											You requested to reset your password. Use the verification code below to continue:
										</p>
										
										<!-- OTP Box -->
										<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px dashed #667eea; border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
											<p style="margin: 0 0 15px; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
												Your Verification Code
											</p>
											<div style="background: white; border-radius: 10px; padding: 20px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);">
												<p style="margin: 0; font-size: 48px; font-weight: 900; letter-spacing: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: 'Courier New', monospace;">
													${otp}
												</p>
											</div>
										</div>
										
										<!-- Timer Warning -->
										<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 30px 0;">
											<p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
												⏰ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>
											</p>
										</div>
										
										<p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 30px 0 0;">
											If you didn't request this password reset, please ignore this email and ensure your account is secure.
										</p>
									</td>
								</tr>
								
								<!-- Footer -->
								<tr>
									<td style="padding: 30px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: center;">
										<p style="margin: 0 0 15px; color: rgba(255,255,255,0.7); font-size: 14px;">
											Need help? Contact us at <a href="mailto:support@z-app.com" style="color: #a78bfa; text-decoration: none; font-weight: 600;">support@z-app.com</a>
										</p>
										<p style="margin: 0 0 20px; color: rgba(255,255,255,0.5); font-size: 12px;">
											© ${new Date().getFullYear()} Z-APP. All rights reserved.
										</p>
										<div style="margin-top: 20px;">
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Privacy Policy</a>
											<span style="color: rgba(255,255,255,0.3);">•</span>
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Terms of Service</a>
											<span style="color: rgba(255,255,255,0.3);">•</span>
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Help Center</a>
										</div>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		try {
			console.log(`📧 Sending OTP to ${user.email} for username: ${username}`);
			await sendEmail(user.email, "Password Reset OTP - Z-APP", message);
			console.log(`✅ OTP sent successfully to ${user.email}`);
			
			// Return masked email for security
			const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
			res.status(200).json({ 
				message: "OTP sent to your email",
				email: maskedEmail,
				expiresIn: 600 // 10 minutes in seconds
			});
		} catch (emailError) {
			console.error("❌ Email send error:", emailError);
			await prisma.user.update({
				where: { id: user.id },
				data: {
					resetPasswordToken: null,
					resetPasswordExpire: null
				}
			});
			
			// Check if it's an email configuration error
			if (emailError.message.includes("Email service not configured")) {
				res.status(500).json({ 
					message: "Email service is not configured. Please contact support.",
					error: "EMAIL_NOT_CONFIGURED"
				});
			} else if (emailError.message.includes("Authentication failed")) {
				res.status(500).json({ 
					message: "Email authentication failed. Please contact support.",
					error: "EMAIL_AUTH_FAILED"
				});
			} else {
				res.status(500).json({ 
					message: "Failed to send OTP email. Please try again later.",
					error: "EMAIL_SEND_FAILED"
				});
			}
		}
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// ─── Verify OTP ─────────────────────────────────────
export const verifyResetOTP = async (req, res) => {
	const { username, otp } = req.body;

	try {
		if (!username || !otp) {
			return res.status(400).json({ message: "Username and OTP are required" });
		}

		const user = await prisma.user.findFirst({
			where: {
				username: username.toLowerCase(),
				resetPasswordToken: otp,
				resetPasswordExpire: { gt: new Date() }
			}
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired OTP" });
		}

		// OTP is valid, return success (don't clear OTP yet, need it for password reset)
		res.status(200).json({ message: "OTP verified successfully" });
	} catch (error) {
		console.error("Verify OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// ─── Reset Password with OTP ─────────────────────────────────────
export const resetPassword = async (req, res) => {
	const { username, otp, password } = req.body;

	try {
		if (!username || !otp || !password) {
			return res.status(400).json({ message: "Username, OTP, and password are required" });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long" });
		}

		const user = await prisma.user.findFirst({
			where: {
				username: username.toLowerCase(),
				resetPasswordToken: otp,
				resetPasswordExpire: { gt: new Date() }
			}
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired OTP" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		
		// Update password and clear OTP fields
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				resetPasswordToken: null,
				resetPasswordExpire: null
			}
		});

		res.status(200).json({ message: "Password reset successful" });
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// ─── Send OTP for Password Change ─────────────────────────────────────
export const sendPasswordChangeOTP = async (req, res) => {
	const userId = req.user.id;

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Save OTP to user (expires in 10 minutes)
		await prisma.user.update({
			where: { id: userId },
			data: {
				passwordChangeOTP: otp,
				passwordChangeOTPExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
			}
		});

		// Send OTP via email with Z-APP branding
		const message = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Password Change Verification - Z-APP</title>
			</head>
			<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
				<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
					<tr>
						<td align="center">
							<table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
								<!-- Header with Logo -->
								<tr>
									<td style="padding: 40px 40px 30px; text-align: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
										<div style="background: white; width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
											<span style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Z</span>
										</div>
										<h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Z-APP</h1>
										<p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Connect. Chat. Discover.</p>
									</td>
								</tr>
								
								<!-- Content -->
								<tr>
									<td style="padding: 40px; background-color: white;">
										<div style="text-align: center; margin-bottom: 30px;">
											<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
												<span style="font-size: 30px;">🔒</span>
											</div>
											<h2 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 700;">Password Change</h2>
										</div>
										
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px;">
											Hi <strong style="color: #1e293b;">${user.fullName || user.username}</strong>,
										</p>
										
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 30px;">
											You requested to change your password. Use the verification code below to continue:
										</p>
										
										<!-- OTP Box -->
										<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px dashed #10b981; border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
											<p style="margin: 0 0 15px; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
												Your Verification Code
											</p>
											<div style="background: white; border-radius: 10px; padding: 20px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);">
												<p style="margin: 0; font-size: 48px; font-weight: 900; letter-spacing: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: 'Courier New', monospace;">
													${otp}
												</p>
											</div>
										</div>
										
										<!-- Timer Warning -->
										<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 30px 0;">
											<p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
												⏰ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>
											</p>
										</div>
										
										<!-- Security Notice -->
										<div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; border-radius: 10px; padding: 20px; margin: 30px 0;">
											<p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
												🛡️ <strong>Security Alert:</strong> If you didn't request this password change, please secure your account immediately and contact support.
											</p>
										</div>
									</td>
								</tr>
								
								<!-- Footer -->
								<tr>
									<td style="padding: 30px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: center;">
										<p style="margin: 0 0 15px; color: rgba(255,255,255,0.7); font-size: 14px;">
											Need help? Contact us at <a href="mailto:support@z-app.com" style="color: #a78bfa; text-decoration: none; font-weight: 600;">support@z-app.com</a>
										</p>
										<p style="margin: 0 0 20px; color: rgba(255,255,255,0.5); font-size: 12px;">
											© ${new Date().getFullYear()} Z-APP. All rights reserved.
										</p>
										<div style="margin-top: 20px;">
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Privacy Policy</a>
											<span style="color: rgba(255,255,255,0.3);">•</span>
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Terms of Service</a>
											<span style="color: rgba(255,255,255,0.3);">•</span>
											<a href="#" style="display: inline-block; margin: 0 10px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 12px;">Help Center</a>
										</div>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		try {
			console.log(`📧 Sending password change OTP to ${user.email}`);
			await sendEmail(user.email, "Password Change Verification - Z-APP", message);
			console.log(`✅ OTP sent successfully to ${user.email}`);

			const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
			res.status(200).json({ 
				message: "OTP sent to your email",
				email: maskedEmail,
				expiresIn: 600 // 10 minutes in seconds
			});
		} catch (emailError) {
			console.error("Email sending error:", emailError);
			await prisma.user.update({
				where: { id: userId },
				data: {
					passwordChangeOTP: null,
					passwordChangeOTPExpires: null
				}
			});
			
			// Check if it's an email configuration error
			if (emailError.message.includes("Email service not configured")) {
				return res.status(500).json({ 
					message: "Email service is not configured. Please contact support.",
					error: "EMAIL_NOT_CONFIGURED"
				});
			} else if (emailError.message.includes("Authentication failed")) {
				return res.status(500).json({ 
					message: "Email authentication failed. Please contact support.",
					error: "EMAIL_AUTH_FAILED"
				});
			} else {
				return res.status(500).json({ 
					message: "Failed to send OTP email. Please try again later.",
					error: "EMAIL_SEND_FAILED"
				});
			}
		}
	} catch (error) {
		console.error("Send password change OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// ─── Change Password with OTP ─────────────────────────────────────
export const changePassword = async (req, res) => {
	const { otp, currentPassword, newPassword } = req.body;
	const userId = req.user.id;

	try {
		if (!otp || !currentPassword || !newPassword) {
			return res.status(400).json({ message: "OTP, current password and new password are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: "New password must be at least 6 characters long" });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Verify OTP
		if (!user.passwordChangeOTP || user.passwordChangeOTP !== otp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		if (!user.passwordChangeOTPExpires || user.passwordChangeOTPExpires < new Date()) {
			return res.status(400).json({ message: "OTP has expired" });
		}

		// Verify current password
		const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordCorrect) {
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);
		
		// Update password and clear OTP fields
		await prisma.user.update({
			where: { id: userId },
			data: {
				password: hashedPassword,
				passwordChangeOTP: null,
				passwordChangeOTPExpires: null
			}
		});

		res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// ─── Send Email Change OTP ────────────────────────────────────
export const sendEmailChangeOTP = async (req, res) => {
	try {
		const { newEmail } = req.body;
		const userId = req.user.id;

		if (!newEmail) {
			return res.status(400).json({ error: "New email is required" });
		}

		// Check if email already exists
		const existingUser = await prisma.user.findUnique({ 
			where: { email: newEmail.toLowerCase() } 
		});
		if (existingUser) {
			return res.status(400).json({ error: "Email already in use" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Store OTP in user document (expires in 10 minutes)
		await prisma.user.update({
			where: { id: userId },
			data: {
				emailChangeOTP: otp,
				emailChangeOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
				pendingEmail: newEmail.toLowerCase()
			}
		});

		// TODO: Send email with OTP using nodemailer
		// For now, we'll just return the OTP in development
		console.log(`Email Change OTP for ${newEmail}: ${otp}`);
		
		// In production, send actual email

		res.status(200).json({ 
			message: "OTP sent to new email",
			// Remove this in production:
			otp: process.env.NODE_ENV === "development" ? otp : undefined
		});
	} catch (error) {
		console.log("Error in sendEmailChangeOTP controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

// ─── Verify Email Change OTP ──────────────────────────────────
export const verifyEmailChangeOTP = async (req, res) => {
	try {
		const { newEmail, otp } = req.body;
		const userId = req.user.id;

		if (!newEmail || !otp) {
			return res.status(400).json({ error: "Email and OTP are required" });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId }
		});
		
		if (!user.emailChangeOTP || !user.emailChangeOTPExpires) {
			return res.status(400).json({ error: "No OTP request found" });
		}

		if (new Date() > user.emailChangeOTPExpires) {
			return res.status(400).json({ error: "OTP has expired" });
		}

		if (user.emailChangeOTP !== otp) {
			return res.status(400).json({ error: "Invalid OTP" });
		}

		if (user.pendingEmail !== newEmail.toLowerCase()) {
			return res.status(400).json({ error: "Email mismatch" });
		}

		// Update email and clear OTP fields
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				email: newEmail.toLowerCase(),
				emailChangeOTP: null,
				emailChangeOTPExpires: null,
				pendingEmail: null
			}
		});

		// Remove password from response
		const { password, ...userWithoutPassword } = updatedUser;

		res.status(200).json({ 
			message: "Email updated successfully",
			user: userWithoutPassword
		});
	} catch (error) {
		console.log("Error in verifyEmailChangeOTP controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};
