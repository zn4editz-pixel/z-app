import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { User, BadgeCheck, Mail, Calendar, MapPin, Shield } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import VerificationRequestModal from "../components/VerificationRequestModal";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  const { authUser } = useAuthStore();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  return (
    <>
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

            {/* Avatar section (Read-Only) */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <img
                  src={authUser?.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-base-300"
                />
              </div>
              <div className="text-center">
                <Link to="/settings" className="btn btn-sm btn-outline btn-primary gap-2">
                  Edit Profile
                </Link>
                <p className="text-xs text-base-content/50 mt-2">
                  Go to Settings to update your photo and details
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Bio Display */}
              {authUser?.bio ? (
                <div className="bg-base-200 rounded-lg p-4 text-center">
                  <p className="text-sm sm:text-base text-base-content/80 italic">
                    "{authUser.bio}"
                  </p>
                </div>
              ) : (
                <div className="text-center text-sm text-base-content/50 italic">
                  No bio yet
                </div>
              )}

              {/* Read-Only Details Grid */}
              <div className="grid gap-4">

                {/* Full Name */}
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-base-content/60" />
                    <div>
                      <p className="text-xs text-base-content/60">Full Name</p>
                      <p className="font-medium text-sm sm:text-base">{authUser?.fullName}</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-base-content/60" />
                    <div>
                      <p className="text-xs text-base-content/60">Email Address</p>
                      {/* obscure email slightly for privacy in read-only view? optional */}
                      <p className="font-medium text-sm sm:text-base break-all">{authUser?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-base-content/60" />
                    <div>
                      <p className="text-xs text-base-content/60">Username</p>
                      <p className="font-medium text-sm sm:text-base">@{authUser?.username}</p>
                    </div>
                  </div>
                </div>

                {/* Location (if available) */}
                {(authUser?.country || authUser?.city) && (
                  <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-base-content/60" />
                      <div>
                        <p className="text-xs text-base-content/60">Location</p>
                        <p className="font-medium text-sm sm:text-base">
                          {authUser?.city ? `${authUser.city}, ` : ''}{authUser?.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="bg-base-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Account Information</h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2 border-b border-base-300">
                  <span className="text-base-content/70 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </span>
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

        {/* Verification Request Modal */}
        <VerificationRequestModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      </div>
    </>
  );
};

export default ProfilePage;
