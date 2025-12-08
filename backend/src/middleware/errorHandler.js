// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
	console.error("Error:", err);

	// Prisma validation error
	if (err.name === "PrismaClientValidationError") {
		return res.status(400).json({
			message: "Validation Error",
			error: err.message,
		});
	}

	// Prisma unique constraint error
	if (err.code === "P2002") {
		const field = err.meta?.target?.[0] || "field";
		return res.status(400).json({
			message: `${field} already exists`,
		});
	}

	// Prisma record not found
	if (err.code === "P2025") {
		return res.status(404).json({
			message: "Record not found",
		});
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({
			message: "Invalid token",
		});
	}

	if (err.name === "TokenExpiredError") {
		return res.status(401).json({
			message: "Token expired",
		});
	}

	// Multer file upload errors
	if (err.name === "MulterError") {
		return res.status(400).json({
			message: `File upload error: ${err.message}`,
		});
	}

	// Default error
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	res.status(statusCode).json({
		message,
		...(process.env.NODE_ENV === "development" && { stack: err.stack }),
	});
};

// 404 handler
export const notFound = (req, res, next) => {
	const error = new Error(`Not Found - ${req.originalUrl}`);
	res.status(404);
	next(error);
};
