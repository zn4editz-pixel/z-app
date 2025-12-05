import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
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

// Add indexes for new fields (username already has unique: true which creates an index)
userSchema.index({ friends: 1 });
userSchema.index({ friendRequestsSent: 1 });
userSchema.index({ friendRequestsReceived: 1 });

const User = mongoose.model("User", userSchema);

export default User;