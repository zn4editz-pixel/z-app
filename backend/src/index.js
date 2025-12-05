import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { fileURLToPath } from "url";
import path from "path";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { apiLimiter } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// --- Routes Imports ---
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";

import User from "./models/user.model.js";

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
// Security headers
app.use(helmet({
	contentSecurityPolicy: false, // Disable for now to allow inline scripts
	crossOriginEmbedderPolicy: false, // Allow embedding for WebRTC
}));

// Sanitize data to prevent MongoDB injection
app.use(mongoSanitize());

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// CORS configuration
const allowedOrigins = [
	FRONTEND_URL,
	"https://z-app-beta-z.onrender.com",
	"https://z-pp-main-com.onrender.com",
	"http://localhost:5173",
];

// Allow all origins for mobile app (Capacitor apps don't send origin header)
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (mobile apps, Postman, etc.)
			if (!origin) return callback(null, true);
			// Allow all origins in development
			if (process.env.NODE_ENV !== "production") return callback(null, true);
			// In production, check allowed origins
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			// Allow all other origins (for mobile apps)
			return callback(null, true);
		},
		credentials: true,
	})
);
// --- End Middleware ---

// --- Health Check Endpoint ---
app.get("/health", (req, res) => {
	res.status(200).json({ 
		status: "ok", 
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || "development"
	});
});

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);

// --- *** THIS SECTION IS NOW FIXED *** ---

// --- Serve Frontend ---
// In production, serve the built frontend from backend/dist
// In development, the frontend runs separately on Vite dev server

if (process.env.NODE_ENV === "production") {
	const frontendDistPath = path.join(__dirname, "../dist");
	
	// 1. Serve static files from the React frontend build
	app.use(express.static(frontendDistPath));
	
	// 2. The "catchall" handler: for any request that doesn't
	//    match one of our API routes, send back React's index.html file.
	app.get("*", (req, res) => {
		res.sendFile(path.join(frontendDistPath, "index.html"));
	});
} else {
	// In development, just show a message
	app.get("/", (req, res) => {
		res.json({ 
			message: "API is running. Frontend is on http://localhost:5173",
			status: "development"
		});
	});
}

// --- *** END OF FIXED SECTION *** ---

// --- Error Handling Middleware (must be last) ---
app.use(notFound);
app.use(errorHandler);

// --- Default Admin Creation ---
const createDefaultAdmin = async () => {
	try {
		const adminEmail = process.env.ADMIN_EMAIL;
		const adminUsername = process.env.ADMIN_USERNAME || "admin";

		if (!adminEmail) {
			console.warn("⚠️ ADMIN_EMAIL not set in .env");
			return;
		}

		const existingAdmin = await User.findOne({ email: adminEmail });

		if (!existingAdmin) {
			const usernameTaken = await User.findOne({ username: adminUsername });
			if (usernameTaken) {
				console.error(
					`❌ Cannot create admin: Username '${adminUsername}' is already taken.`
				);
				return;
			}

			const hashedPassword = await bcrypt.hash("safwan123", 10);
			const admin = new User({
				fullName: "Admin",
				email: adminEmail,
				username: adminUsername,
				nickname: "Admin",
				password: hashedPassword,
				isAdmin: true,
				isVerified: true,
				hasCompletedProfile: true,
			});

			await admin.save();
			console.log(`✅ Default admin created: ${adminEmail}`);
		} else if (!existingAdmin.hasCompletedProfile) {
			existingAdmin.hasCompletedProfile = true;
			await existingAdmin.save();
			console.log(
				`✅ Marked existing admin '${existingAdmin.email}' as profile complete.`
			);
		} else {
			console.log("ℹ️ Admin already exists.");
		}
	} catch (error) {
		console.error("❌ Failed to create/update default admin:", error.message);
	}
};

// --- Start Server ---
server.listen(PORT, async () => {
	await connectDB();
	await createDefaultAdmin();
	console.log(`🚀 Server running at http://localhost:${PORT}`);
});
