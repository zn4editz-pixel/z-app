import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, Mail, Shield } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP & Change Password
  const [isLoading, setIsLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  
  // Step 1 - OTP Request
  const [otpSent, setOtpSent] = useState(false);
  
  // Step 2 - Password Change
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/send-password-change-otp");
      setMaskedEmail(res.data.email);
      setOtpSent(true);
      setStep(2);
      toast.success("OTP sent to your email!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!otp || !currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/change-password", {
        otp,
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-xs sm:btn-sm gap-1 sm:gap-2 mb-3 sm:mb-4"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Back</span>
        </button>

        <div className="bg-base-100 rounded-xl shadow-lg p-4 sm:p-6 border border-base-300">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Change Password</h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {step === 1 ? "Verify your identity" : "Enter new password"}
            </p>
          </div>

          {/* Step 1: Send OTP */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 p-2 sm:p-3 bg-info/10 rounded-lg border border-info/20">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-[11px] sm:text-xs text-base-content/70">
                  For security, we'll send a verification code to your email
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full btn btn-primary btn-sm sm:btn-md gap-2 h-10 sm:h-12"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-xs sm:text-sm">Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Send Verification Code</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Verify OTP & Change Password */}
          {step === 2 && (
            <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
              {/* OTP Sent Message */}
              <div className="flex items-start gap-2 p-2 sm:p-3 bg-success/10 rounded-lg border border-success/20">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-[11px] sm:text-xs text-base-content/70">
                  Verification code sent to {maskedEmail}
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="label py-1 sm:py-2">
                  <span className="label-text text-xs sm:text-sm font-medium">Verification Code</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm sm:input-md w-full text-sm"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              {/* Current Password */}
              <div>
                <label className="label py-1 sm:py-2">
                  <span className="label-text text-xs sm:text-sm font-medium">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="input input-bordered input-sm sm:input-md w-full pr-10 text-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="label py-1 sm:py-2">
                  <span className="label-text text-xs sm:text-sm font-medium">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="input input-bordered input-sm sm:input-md w-full pr-10 text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label py-1 sm:py-2">
                  <span className="label-text text-xs sm:text-sm font-medium">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input input-bordered input-sm sm:input-md w-full pr-10 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-base-content/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-sm sm:btn-md gap-2 h-10 sm:h-12 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-xs sm:text-sm">Changing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Change Password</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full btn btn-ghost btn-xs sm:btn-sm text-xs sm:text-sm"
              >
                Resend Code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
