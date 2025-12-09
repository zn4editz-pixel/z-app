import nodemailer from "nodemailer";

// Create email transporter
const createTransporter = () => {
	// For development, use ethereal email (fake SMTP)
	// For production, use real SMTP service (Gmail, SendGrid, etc.)
	
	if (process.env.NODE_ENV === "production") {
		// Production: Use real email service
		// Check if nodemailer is properly loaded
		if (!nodemailer || typeof nodemailer.createTransport !== "function") {
			console.warn("⚠️ Nodemailer not available, using mock transporter");
			return {
				sendMail: async (mailOptions) => {
					console.log("📧 Email would be sent to:", mailOptions.to);
					return { messageId: "mock-" + Date.now() };
				},
			};
		}
		
		return nodemailer.createTransport({
			service: process.env.EMAIL_SERVICE || "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
			},
		});
	} else {
		// Development: Log to console instead of sending
		return {
			sendMail: async (mailOptions) => {
				console.log("\n📧 EMAIL WOULD BE SENT:");
				console.log("To:", mailOptions.to);
				console.log("Subject:", mailOptions.subject);
				console.log("Content:", mailOptions.text || mailOptions.html);
				console.log("---\n");
				return { messageId: "dev-" + Date.now() };
			},
		};
	}
};

const transporter = createTransporter();

// Email templates
export const emailTemplates = {
	verificationApproved: (userName) => ({
		subject: "✅ Verification Approved - Z-APP",
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
				<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
					<tr>
						<td align="center">
							<table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
								<tr>
									<td style="padding: 40px; text-align: center; background: rgba(255,255,255,0.1);">
										<div style="background: white; width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-center;">
											<span style="font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Z</span>
										</div>
										<h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800;">Z-APP</h1>
									</td>
								</tr>
								<tr>
									<td style="padding: 40px; background-color: white;">
										<div style="text-align: center; margin-bottom: 30px;">
											<span style="font-size: 60px;">🎉</span>
											<h2 style="margin: 20px 0 0; color: #1e293b; font-size: 28px; font-weight: 700;">Congratulations!</h2>
										</div>
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px;">
											Hi <strong style="color: #1e293b;">${userName}</strong>,
										</p>
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 30px;">
											Great news! Your verification request has been <strong style="color: #10b981;">approved</strong>.
										</p>
										<div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px solid #10b981; border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0;">
											<p style="margin: 0; font-size: 48px;">✓</p>
											<p style="margin: 15px 0 0; color: #166534; font-size: 18px; font-weight: 700;">
												Your account is now verified!
											</p>
										</div>
										<p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0;">
											You now have a verified badge on your profile, which will be visible to all users.
										</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 30px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: center;">
										<p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">
											Thank you for being a valued member of Z-APP!
										</p>
										<p style="margin: 15px 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">
											© ${new Date().getFullYear()} Z-APP. All rights reserved.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`,
		text: `Hi ${userName},\n\nGreat news! Your verification request has been approved.\n\nYou now have a verified badge on your profile.\n\nThank you for being a valued member of Z-APP!`,
	}),

	verificationRejected: (userName, reason) => ({
		subject: "❌ Verification Request Update - Z-APP",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
				<div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h1 style="color: #ef4444; margin-bottom: 20px;">Verification Request Update</h1>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						Hi <strong>${userName}</strong>,
					</p>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						We've reviewed your verification request. Unfortunately, we're unable to approve it at this time.
					</p>
					<div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 5px;">
						<p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold;">
							Reason:
						</p>
						<p style="margin: 0; color: #7f1d1d;">
							${reason || "Does not meet verification criteria"}
						</p>
					</div>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						You can submit a new verification request after addressing the issues mentioned above.
					</p>
					<p style="font-size: 14px; color: #666; margin-top: 30px;">
						If you have any questions, please contact our support team.
					</p>
				</div>
			</div>
		`,
		text: `Hi ${userName},\n\nWe've reviewed your verification request. Unfortunately, we're unable to approve it at this time.\n\nReason: ${reason || "Does not meet verification criteria"}\n\nYou can submit a new verification request after addressing the issues mentioned above.`,
	}),

	reportStatusUpdate: (userName, status, reportedUser) => ({
		subject: `📢 Report Status Update - Z-APP`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
				<div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h1 style="color: #3b82f6; margin-bottom: 20px;">Report Status Update</h1>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						Hi <strong>${userName}</strong>,
					</p>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						Your report regarding user <strong>${reportedUser}</strong> has been updated.
					</p>
					<div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 5px;">
						<p style="margin: 0; color: #1e40af; font-weight: bold;">
							Status: ${status.replace('_', ' ').toUpperCase()}
						</p>
					</div>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						${status === 'action_taken' 
							? 'We have taken appropriate action based on your report.' 
							: status === 'dismissed' 
							? 'After review, we found no violation of our community guidelines.' 
							: 'Our moderation team is reviewing your report.'}
					</p>
					<p style="font-size: 14px; color: #666; margin-top: 30px;">
						Thank you for helping keep Z-APP safe!
					</p>
				</div>
			</div>
		`,
		text: `Hi ${userName},\n\nYour report regarding user ${reportedUser} has been updated.\n\nStatus: ${status.replace('_', ' ').toUpperCase()}\n\nThank you for helping keep Z-APP safe!`,
	}),

	accountSuspended: (userName, reason, until) => ({
		subject: "⚠️ Account Suspended - Z-APP",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
				<div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
					<h1 style="color: #f59e0b; margin-bottom: 20px;">⚠️ Account Suspended</h1>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						Hi <strong>${userName}</strong>,
					</p>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						Your account has been temporarily suspended.
					</p>
					<div style="margin: 30px 0; padding: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 5px;">
						<p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">
							Reason:
						</p>
						<p style="margin: 0 0 15px 0; color: #78350f;">
							${reason}
						</p>
						<p style="margin: 0; color: #92400e; font-weight: bold;">
							Suspended Until: ${new Date(until).toLocaleString()}
						</p>
					</div>
					<p style="font-size: 16px; color: #333; line-height: 1.6;">
						You will be able to access your account again after the suspension period ends.
					</p>
					<p style="font-size: 14px; color: #666; margin-top: 30px;">
						If you believe this is a mistake, please contact our support team.
					</p>
				</div>
			</div>
		`,
		text: `Hi ${userName},\n\nYour account has been temporarily suspended.\n\nReason: ${reason}\nSuspended Until: ${new Date(until).toLocaleString()}\n\nYou will be able to access your account again after the suspension period ends.`,
	}),
};

// Send email function
export const sendEmail = async (to, template) => {
	try {
		const mailOptions = {
			from: `"Z-APP" <${process.env.EMAIL_USER || "noreply@z-app.com"}>`,
			to,
			subject: template.subject,
			text: template.text,
			html: template.html,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("✅ Email sent:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("❌ Email send error:", error);
		return { success: false, error: error.message };
	}
};

// Helper functions for specific emails
export const sendVerificationApprovedEmail = async (userEmail, userName) => {
	return sendEmail(userEmail, emailTemplates.verificationApproved(userName));
};

export const sendVerificationRejectedEmail = async (userEmail, userName, reason) => {
	return sendEmail(userEmail, emailTemplates.verificationRejected(userName, reason));
};

export const sendReportStatusEmail = async (userEmail, userName, status, reportedUser) => {
	return sendEmail(userEmail, emailTemplates.reportStatusUpdate(userName, status, reportedUser));
};

export const sendAccountSuspendedEmail = async (userEmail, userName, reason, until) => {
	return sendEmail(userEmail, emailTemplates.accountSuspended(userName, reason, until));
};
