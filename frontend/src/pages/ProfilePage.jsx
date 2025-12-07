import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, BadgeCheck, Edit2, Check, X, Loader2, AlertCircle, Clock, AtSign } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import VerificationRequestModal from "../components/VerificationRequestModal";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(authUser?.username || "");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChangeInfo, setUsernameChangeInfo] = useState(null);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);
  
  // Full name editing state
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const [newFullName, setNewFullName] = useState(authUser?.fullName || "");

  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(authUser?.email || "");
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

  // Fetch username change info on mount
  useEffect(() => {
    fetchUsernameChangeInfo();
  }, []);

  const fetchUsernameChangeInfo = async () => {
    try {
      const res = await axiosInstance.get("/users/username-change-info");
      setUsernameChangeInfo(res.data);
    } catch (error) {
      console.error("Error fetching username change info:", error);
    }
  };

  // Check username availability with debounce
  useEffect(() => {
    if (!isEditingUsername || newUsername === authUser?.username) {
      setUsernameAvailable(null);
      return;
    }

    if (!newUsername || newUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await axiosInstance.get(`/users/check-username/${newUsername}`);
        setUsernameAvailable(res.data.available);
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, isEditingUsername, authUser?.username]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleUsernameChange = async () => {
    if (!usernameAvailable || !usernameChangeInfo?.canChange) return;

    try {
      await updateProfile({ username: newUsername });
      toast.success("Username updated successfully!");
      setIsEditingUsername(false);
      setShowUsernameConfirm(false);
      fetchUsernameChangeInfo();
      // Refresh page to update auth user
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update username");
    }
  };

  const handleFullNameChange = async () => {
    if (!newFullName || newFullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }

    try {
      await updateProfile({ fullName: newFullName.trim() });
      toast.success("Full name updated successfully!");
      setIsEditingFullName(false);
      // Refresh page to update auth user
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update full name");
    }
  };

  const handleSendEmailOTP = async () => {
    try {
      await axiosInstance.post("/auth/send-email-otp", { newEmail });
      toast.success("OTP sent to your new email!");
      setShowEmailOTP(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleVerifyEmailOTP = async () => {
    setIsVerifyingOTP(true);
    try {
      await axiosInstance.post("/auth/verify-email-change", { newEmail, otp });
      toast.success("Email updated successfully!");
      setIsEditingEmail(false);
      setShowEmailOTP(false);
      setOtp("");
      // Refresh page to update auth user
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid OTP");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const formatTimeRemaining = (date) => {
    if (!date) return "";
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    if (diff <= 0) return "Now";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-2 xs:px-3 sm:px-4 pt-14 xs:pt-16 sm:pt-18 md:pt-20 pb-16 xs:pb-18 sm:pb-20 md:pb-10">
        <div className="bg-base-100 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center justify-center gap-2">
              Profile
              {authUser?.isVerified && <VerifiedBadge size="md" />}
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-base-content/70">
              Your profile information
            </p>
          </div>

          {/* Avatar upload section */}
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-base-300"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary hover:scale-105
                  p-2 sm:p-2.5 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-lg
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-xs sm:text-sm text-base-content/60 text-center px-4">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Bio Display */}
            {authUser?.bio && (
              <div className="bg-base-200 rounded-lg p-4 text-center">
                <p className="text-sm sm:text-base text-base-content/80 italic">
                  "{authUser.bio}"
                </p>
                <p className="text-xs text-base-content/50 mt-2">
                  Edit your bio in Settings
                </p>
              </div>
            )}

            {/* Full Name Editing */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-base-content/60 flex items-center gap-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                Full Name
              </div>
              
              {!isEditingFullName ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-base-200 rounded-lg border text-sm sm:text-base">
                    {authUser?.fullName}
                  </p>
                  <button
                    onClick={() => setIsEditingFullName(true)}
                    className="btn btn-sm btn-ghost"
                    title="Edit full name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Your full name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleFullNameChange}
                      disabled={!newFullName || newFullName.trim().length < 2 || newFullName === authUser?.fullName}
                      className="btn btn-success btn-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingFullName(false);
                        setNewFullName(authUser?.fullName || "");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Username Editing */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-base-content/60 flex items-center gap-2">
                <AtSign className="w-3 h-3 sm:w-4 sm:h-4" />
                Username
              </div>
              
              {!isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-base-200 rounded-lg border text-sm sm:text-base">
                    @{authUser?.username}
                  </p>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    disabled={!usernameChangeInfo?.canChange}
                    className="btn btn-sm btn-ghost"
                    title={!usernameChangeInfo?.canChange ? "Username change limit reached" : "Edit username"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                        className="input input-bordered w-full pr-10"
                        placeholder="username"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername ? (
                          <Loader2 className="w-5 h-5 animate-spin text-base-content/50" />
                        ) : usernameAvailable === true ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : usernameAvailable === false ? (
                          <X className="w-5 h-5 text-error" />
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Username feedback messages */}
                    {newUsername && newUsername !== authUser?.username && (
                      <div className="text-xs px-2">
                        {newUsername.length < 3 ? (
                          <p className="text-warning">Username must be at least 3 characters</p>
                        ) : isCheckingUsername ? (
                          <p className="text-base-content/60">Checking availability...</p>
                        ) : usernameAvailable === true ? (
                          <p className="text-success">✓ Username is available</p>
                        ) : usernameAvailable === false ? (
                          <p className="text-error">✗ Username is already taken</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {usernameChangeInfo && (
                    <div className="alert alert-info text-xs sm:text-sm py-2">
                      <AlertCircle className="w-4 h-4" />
                      <div>
                        <p>Changes: {usernameChangeInfo.changesThisWeek}/2 this week</p>
                        {!usernameChangeInfo.canChange && usernameChangeInfo.nextChangeDate && (
                          <p className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            Next change in: {formatTimeRemaining(usernameChangeInfo.nextChangeDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUsernameConfirm(true)}
                      disabled={!newUsername || newUsername.length < 3 || !usernameAvailable || newUsername === authUser?.username}
                      className="btn btn-success btn-sm"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(authUser?.username || "");
                        setUsernameAvailable(null);
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Editing */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-base-content/60 flex items-center gap-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                Email Address
              </div>
              
              {!isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-base-200 rounded-lg border text-sm sm:text-base break-all">
                    {authUser?.email}
                  </p>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="btn btn-sm btn-ghost"
                    title="Edit email"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : !showEmailOTP ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="new@email.com"
                  />
                  <div className="flex items-start gap-2 p-2 bg-base-200 rounded-lg border border-base-300">
                    <AlertCircle className="w-3.5 h-3.5 text-info mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-base-content/70">An OTP will be sent to verify your new email</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendEmailOTP}
                      disabled={!newEmail || newEmail === authUser?.email}
                      className="btn btn-primary btn-sm"
                    >
                      Send OTP
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setNewEmail(authUser?.email || "");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input input-bordered w-full text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-xs text-center text-base-content/60">
                    Enter the 6-digit code sent to {newEmail}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyEmailOTP}
                      disabled={otp.length !== 6 || isVerifyingOTP}
                      className="btn btn-success btn-sm flex-1"
                    >
                      {isVerifyingOTP ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verify
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailOTP(false);
                        setOtp("");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-base-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Account Information</h2>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-base-content/70">Member Since</span>
                <span className="font-medium">{authUser?.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-base-content/70">Account Status</span>
                <span className="badge badge-success badge-sm">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/70">Verification</span>
                {authUser?.isVerified ? (
                  <span className="badge badge-primary badge-sm gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : authUser?.verificationRequest?.status === "pending" ? (
                  <span className="badge badge-warning badge-sm">Pending Review</span>
                ) : (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="btn btn-primary btn-xs gap-1"
                  >
                    <BadgeCheck className="w-3 h-3" />
                    Request Verification
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Username Change Confirmation Modal */}
      {showUsernameConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Username Change</h3>
            <p className="py-4">
              Are you sure you want to change your username to <strong>@{newUsername}</strong>?
              <br />
              <br />
              You have {2 - (usernameChangeInfo?.changesThisWeek || 0)} change(s) remaining this week.
            </p>
            <div className="modal-action">
              <button onClick={handleUsernameChange} className="btn btn-success">
                Confirm
              </button>
              <button onClick={() => setShowUsernameConfirm(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Request Modal */}
      <VerificationRequestModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default ProfilePage;
