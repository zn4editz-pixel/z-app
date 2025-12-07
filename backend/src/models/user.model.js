import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			lowercase: true,
			trim: true,
		},
		username: {
			type: String,
			required: [true, "Username is required"],
			lowercase: true,
			minlength: [3, "Username must be at least 3 characters long"],
			maxlength: [30, "Username cannot be more than 30 characters long"],
			trim: true,
			match: [
				/^[a-zA-Z0-9_.]+$/,
				"Username can only contain letters, numbers, underscores, and periods.",
			],
			validate: {
				validator: function (v) {
					return !/^[0-9]+$/.test(v);
				},
				message: "Username cannot be only numbers.",
			},
		},
		nickname: {
			type: String,
			trim: true,
			maxlength: 50,
		},
		fullName: {
			type: String,
			required: [true, "Full name is required"],
		},
		bio: {
			type: String,
			default: "",
			maxlength: [150, "Bio cannot be more than 150 characters"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: 6,
		},
		profilePic: {
			type: String,
			default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
		},

		// --- Friend & Request Fields ---
		friends: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		friendRequestsSent: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		friendRequestsReceived: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		// ✅ --- NEW: Onboarding Status ---
		hasCompletedProfile: {
			type: Boolean,
			default: false,
		},

		// --- Admin & Moderation Fields ---
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		isSuspended: {
			type: Boolean,
			default: false,
		},
		suspendedUntil: {
			type: Date,
		},
		suspensionReason: {
			type: String,
			default: "",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationRequest: {
			status: {
				type: String,
				enum: ["none", "pending", "approved", "rejected"],
				default: "none",
			},
			reason: {
				type: String,
			},
			idProof: {
				type: String,
			},
			requestedAt: {
				type: Date,
			},
			reviewedAt: {
				type: Date,
			},
			reviewedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		},

		// --- Online Status ---
		isOnline: {
			type: Boolean,
			default: false,
		},
		lastSeen: {
			type: Date,
			default: Date.now,
		},

		// --- Location Data ---
		country: {
			type: String,
			default: 'Unknown'
		},
		countryCode: {
			type: String,
			default: 'XX'
		},
		city: {
			type: String,
			default: 'Unknown'
		},
		region: {
			type: String,
			default: ''
		},
		timezone: {
			type: String,
			default: ''
		},
		isVPN: {
			type: Boolean,
			default: false
		},
		lastIP: {
			type: String,
			default: ''
		},

		// --- Forgot Password Fields ---
		resetPasswordToken: {
			type: String,
		},
		resetPasswordExpire: {
			type: Date,
		},
		
		// --- Username Change Tracking ---
		usernameChangeHistory: [{
			oldUsername: String,
			newUsername: String,
			changedAt: {
				type: Date,
				default: Date.now
			}
		}],
		lastUsernameChange: {
			type: Date,
			default: null
		},
		usernameChangesThisWeek: {
			type: Number,
			default: 0
		},
		weekStartDate: {
			type: Date,
			default: null
		},
		
		// --- Email Change with OTP ---
		emailChangeOTP: {
			type: String
		},
		emailChangeOTPExpires: {
			type: Date
		},
		pendingEmail: {
			type: String
		},
		
		// --- Password Change with OTP ---
		passwordChangeOTP: {
			type: String
		},
		passwordChangeOTPExpires: {
			type: Date
		}
	},
	{ timestamps: true }
);

// ✅ Performance Optimization: Add database indexes for faster queries
userSchema.index({ email: 1 }, { unique: true }); // Login queries (unique)
userSchema.index({ username: 1 }, { unique: true }); // Profile lookups (unique)
userSchema.index({ friends: 1 }); // Friend list queries
userSchema.index({ friendRequestsSent: 1 }); // Sent requests
userSchema.index({ friendRequestsReceived: 1 }); // Received requests
userSchema.index({ createdAt: -1 }); // Recent users
userSchema.index({ isOnline: 1 }); // Online users
userSchema.index({ lastSeen: -1 }); // Last seen queries
userSchema.index({ hasCompletedProfile: 1, isVerified: -1, createdAt: -1 }); // Suggested users (compound index)
userSchema.index({ country: 1 }); // Country-based queries
userSchema.index({ countryCode: 1 }); // Country code queries

const User = mongoose.model("User", userSchema);

export default User;