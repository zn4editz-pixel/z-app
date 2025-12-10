// ⚡ OPTIMIZED ADMIN CONTROLLER
// This file contains performance-optimized versions of admin functions

import prisma from "../lib/prisma.js";
import NodeCache from "node-cache";

// Initialize cache with 30 second TTL
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

// Optimized getAllUsers with pagination and selective fields
export const getAllUsersOptimized = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 0;
		const limit = parseInt(req.query.limit) || 50;
		const search = req.query.search || "";
		
		// Get fresh online status from socket
		const { userSocketMap } = await import("../lib/socket.js");
		const onlineUserIds = Object.keys(userSocketMap);
		
		// Build where clause for search
		const whereClause = search ? {
			OR: [
				{ username: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ nickname: { contains: search, mode: 'insensitive' } }
			]
		} : {};
		
		// Parallel queries for better performance
		const [users, totalCount] = await Promise.all([
			prisma.user.findMany({
				where: whereClause,
				select: {
					id: true,
					username: true,
					nickname: true,
					email: true,
					profilePic: true,
					isVerified: true,
					isSuspended: true,
					suspensionEndTime: true,
					lastSeen: true,
					createdAt: true,
					country: true,
					countryCode: true
				},
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: page * limit
			}),
			prisma.user.count({ where: whereClause })
		]);
		
		// Update online status from socket map
		const usersWithOnlineStatus = users.map(user => ({
			...user,
			isOnline: onlineUserIds.includes(user.id)
		}));
		
		res.status(200).json({
			users: usersWithOnlineStatus,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit)
			}
		});
	} catch (err) {
		console.error("getAllUsersOptimized error:", err);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};

// Optimized getAdminStats with caching
export const getAdminStatsOptimized = async (req, res) => {
	try {
		// Check cache first
		const cacheKey = 'admin_stats';
		const cached = cache.get(cacheKey);
		if (cached) {
			return res.status(200).json(cached);
		}
		
		// Get online users from socket
		const { userSocketMap } = await import("../lib/socket.js");
		const onlineUsers = Object.keys(userSocketMap).length;
		
		// Parallel queries for all stats
		const [
			totalUsers,
			verifiedUsers,
			suspendedUsers,
			totalMessages,
			todayMessages,
			pendingReports,
			pendingVerifications
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { isVerified: true } }),
			prisma.user.count({ where: { isSuspended: true } }),
			prisma.message.count(),
			prisma.message.count({
				where: {
					createdAt: {
						gte: new Date(new Date().setHours(0, 0, 0, 0))
					}
				}
			}),
			prisma.report.count({ where: { status: "pending" } }),
			prisma.user.count({ where: { verificationRequestPending: true } })
		]);
		
		const stats = {
			totalUsers,
			onlineUsers,
			verifiedUsers,
			suspendedUsers,
			totalMessages,
			todayMessages,
			pendingReports,
			pendingVerifications,
			timestamp: new Date().toISOString()
		};
		
		// Cache for 30 seconds
		cache.set(cacheKey, stats);
		
		res.status(200).json(stats);
	} catch (err) {
		console.error("getAdminStatsOptimized error:", err);
		res.status(500).json({ error: "Failed to fetch stats" });
	}
};

// Optimized getReports with pagination
export const getReportsOptimized = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 0;
		const limit = parseInt(req.query.limit) || 20;
		const status = req.query.status || "all";
		
		const whereClause = status !== "all" ? { status } : {};
		
		const [reports, totalCount] = await Promise.all([
			prisma.report.findMany({
				where: whereClause,
				include: {
					reporter: {
						select: {
							id: true,
							username: true,
							nickname: true,
							profilePic: true
						}
					},
					reportedUser: {
						select: {
							id: true,
							username: true,
							nickname: true,
							profilePic: true,
							isSuspended: true
						}
					}
				},
				orderBy: { createdAt: "desc" },
				take: limit,
				skip: page * limit
			}),
			prisma.report.count({ where: whereClause })
		]);
		
		res.status(200).json({
			reports,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit)
			}
		});
	} catch (err) {
		console.error("getReportsOptimized error:", err);
		res.status(500).json({ error: "Failed to fetch reports" });
	}
};

// Clear cache utility
export const clearAdminCache = () => {
	cache.flushAll();
	console.log("✅ Admin cache cleared");
};

export default {
	getAllUsersOptimized,
	getAdminStatsOptimized,
	getReportsOptimized,
	clearAdminCache
};
