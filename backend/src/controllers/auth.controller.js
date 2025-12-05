import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import sendEmail from "../utils/sendEmail.js";

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

		const existingUserByEmail = await User.findOne({ email });
		if (existingUserByEmail) {
			return res.status(409).json({ message: "Email is already registered." });
		}

		const existingUserByUsername = await User.findOne({ username: username.toLowerCase() });
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

		const newUser = new User({
			fullName,
			email,
			username: username.toLowerCase(),
			nickname: fullName, // Default nickname
			bio: bio || "",
			password: hashedPassword,
			profilePic: uploadedProfilePic,
		});

		await newUser.save();
		const token = generateToken(newUser._id, res);

		res.status(201).json({
			token, // Return token for mobile apps
			_id: newUser._id,
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

		const user = await User.findOne({
			$or: [{ email: emailOrUsername }, { username: emailOrUsername.toLowerCase() }],
		});

		if (!user) return res.status(401).json({ message: "Invalid credentials." });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

		if (user.isBlocked) return res.status(403).json({ message: "Your account is blocked." });
		if (user.isSuspended) return res.status(403).json({ message: "Your account is suspended." });

		const token = generateToken(user._id, res);

		res.status(200).json({
			token, // Return token for mobile apps
			_id: user._id,
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
		const userId = req.user._id;

		if (!nickname) {
			return res.status(400).json({ message: "Nickname is required." });
		}

		const user = await User.findById(userId);
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

		user.nickname = nickname;
		user.bio = bio || "";
		user.profilePic = uploadedProfilePic;
		user.hasCompletedProfile = true;

		const updatedUser = await user.save();
		const userObject = updatedUser.toObject();
		delete userObject.password;

		res.status(200).json(userObject);
	} catch (error) {
		console.error("Complete Profile Setup Error:", error);
		res.status(500).json({ message: "Failed to update profile." });
	}
};

// ─── Update Profile ─────────────────────────────────────
export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body;
		const userId = req.user._id;

		if (!profilePic) {
			return res.status(400).json({ message: "Profile picture is required." });
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic);
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: uploadResponse.secure_url },
			{ new: true }
		).select("-password");

		res.status(200).json(updatedUser);
	} catch (error) {
		console.error("Update Profile Error:", error);
		res.status(500).json({ message: "Failed to update profile picture." });
	}
};

// ─── Check Auth ─────────────────────────────────────────
export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) return res.status(4404).json({ message: "User not found." });

		res.status(200).json({
			_id: user._id,
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
		const user = await User.findOne({ username: username.toLowerCase() });
		if (!user) {
			return res.status(404).json({ message: "No account with that username" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Save OTP to user (expires in 60 seconds)
		user.resetPasswordToken = otp;
		user.resetPasswordExpire = Date.now() + 60 * 1000; // 60 seconds
		await user.save({ validateBeforeSave: false });

		// Send OTP via email
		const message = `
      <h1>Password Reset OTP</h1>
      <p>Your OTP for password reset is:</p>
      <h2 style="color: #6366f1; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
      <p><strong>This OTP will expire in 60 seconds.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

		try {
			console.log(`📧 Sending OTP to ${user.email} for username: ${username}`);
			await sendEmail(user.email, "Password Reset OTP", message);
			console.log(`✅ OTP sent successfully to ${user.email}`);
			
			// Return masked email for security
			const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
			res.status(200).json({ 
				message: "OTP sent to your email",
				email: maskedEmail 
			});
		} catch (emailError) {
			console.error("❌ Email send error:", emailError);
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;
			await user.save({ validateBeforeSave: false });
			res.status(500).json({ message: "Email could not be sent. Please check your email configuration." });
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

		const user = await User.findOne({
			username: username.toLowerCase(),
			resetPasswordToken: otp,
			resetPasswordExpire: { $gt: Date.now() },
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

		const user = await User.findOne({
			username: username.toLowerCase(),
			resetPasswordToken: otp,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired OTP" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(password, salt);
		
		// Clear OTP fields
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save();

		res.status(200).json({ message: "Password reset successful" });
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// ─── Send OTP for Password Change ─────────────────────────────────────
export const sendPasswordChangeOTP = async (req, res) => {
	const userId = req.user._id;

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Save OTP to user (expires in 5 minutes)
		user.passwordChangeOTP = otp;
		user.passwordChangeOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
		await user.save({ validateBeforeSave: false });

		// Send OTP via email
		const message = `
      <h1>Password Change Verification</h1>
      <p>You requested to change your password. Your verification OTP is:</p>
      <h2 style="color: #6366f1; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
      <p><strong>This OTP will expire in 5 minutes.</strong></p>
      <p>If you didn't request this, please ignore this email and secure your account.</p>
    `;

		try {
			console.log(`📧 Sending password change OTP to ${user.email}`);
			await sendEmail(user.email, "Password Change Verification", message);
			console.log(`✅ OTP sent successfully to ${user.email}`);

			const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
			res.status(200).json({ 
				message: "OTP sent to your email",
				email: maskedEmail 
			});
		} catch (emailError) {
			console.error("Email sending error:", emailError);
			user.passwordChangeOTP = undefined;
			user.passwordChangeOTPExpires = undefined;
			await user.save({ validateBeforeSave: false });
			return res.status(500).json({ message: "Failed to send OTP email" });
		}
	} catch (error) {
		console.error("Send password change OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// ─── Change Password with OTP ─────────────────────────────────────
export const changePassword = async (req, res) => {
	const { otp, currentPassword, newPassword } = req.body;
	const userId = req.user._id;

	try {
		if (!otp || !currentPassword || !newPassword) {
			return res.status(400).json({ message: "OTP, current password and new password are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: "New password must be at least 6 characters long" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Verify OTP
		if (!user.passwordChangeOTP || user.passwordChangeOTP !== otp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		if (!user.passwordChangeOTPExpires || user.passwordChangeOTPExpires < Date.now()) {
			return res.status(400).json({ message: "OTP has expired" });
		}

		// Verify current password
		const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordCorrect) {
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(newPassword, salt);
		
		// Clear OTP fields
		user.passwordChangeOTP = undefined;
		user.passwordChangeOTPExpires = undefined;
		await user.save();

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
		const userId = req.user._id;

		if (!newEmail) {
			return res.status(400).json({ error: "New email is required" });
		}

		// Check if email already exists
		const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({ error: "Email already in use" });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Store OTP in user document (expires in 10 minutes)
		const user = await User.findById(userId);
		user.emailChangeOTP = otp;
		user.emailChangeOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
		user.pendingEmail = newEmail.toLowerCase();
		await user.save();

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
		const userId = req.user._id;

		if (!newEmail || !otp) {
			return res.status(400).json({ error: "Email and OTP are required" });
		}

		const user = await User.findById(userId);
		
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

		// Update email
		user.email = newEmail.toLowerCase();
		user.emailChangeOTP = undefined;
		user.emailChangeOTPExpires = undefined;
		user.pendingEmail = undefined;
		await user.save();

		res.status(200).json({ 
			message: "Email updated successfully",
			user: {
				...user.toObject(),
				password: undefined
			}
		});
	} catch (error) {
		console.log("Error in verifyEmailChangeOTP controller", error.message);
		res.status(500).json({ message: "Internal Server Error" });
	}
};
