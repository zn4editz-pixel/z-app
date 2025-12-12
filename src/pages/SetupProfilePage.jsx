import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import ImageCropper from "../components/ImageCropper";

const SetupProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [formData, setFormData] = useState({
    nickname: authUser?.fullName || "",
    bio: "",
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setTempImage(reader.result);
      setShowCropper(true);
    };
  };

  const handleCropComplete = (croppedImage) => {
    setSelectedImg(croppedImage);
    setShowCropper(false);
    setTempImage(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nickname || formData.nickname.trim().length < 2) {
      toast.error("Nickname must be at least 2 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSend = {
        nickname: formData.nickname.trim(),
        bio: formData.bio.trim(),
        profilePic: selectedImg,
      };

      const res = await axiosInstance.post("/auth/setup-profile", dataToSend);
      const updatedUser = res.data;

      // Update auth store
      setAuthUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));

      toast.success("Profile setup complete!");
      navigate("/");
    } catch (error) {
      console.error("Profile setup error:", error);
      toast.error(error.response?.data?.message || "Failed to setup profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Set hasCompletedProfile to true without additional info
    const skipSetup = async () => {
      try {
        const res = await axiosInstance.post("/auth/setup-profile", {
          nickname: authUser?.fullName || authUser?.username,
          bio: "",
        });
        const updatedUser = res.data;
        setAuthUser(updatedUser);
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
        navigate("/");
      } catch (error) {
        console.error("Skip profile setup error:", error);
        toast.error("Failed to complete setup");
      }
    };
    skipSetup();
  };

  return (
    <>
      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-2xl shadow-2xl p-6 sm:p-8 border border-base-300">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Complete Your Profile
            </h1>
            <p className="text-sm sm:text-base text-base-content/70 mt-2">
              Let's personalize your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-base-300 bg-base-200">
                  {selectedImg ? (
                    <img
                      src={selectedImg}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base-content/30">
                      <Camera className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 p-2.5 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:scale-105"
                >
                  <Camera className="w-5 h-5 text-primary-content" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
              <p className="text-xs text-base-content/60 text-center">
                Upload a profile picture (optional)
              </p>
            </div>

            {/* Nickname Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Nickname <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="How should we call you?"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                disabled={isSubmitting}
                maxLength={50}
                required
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  This is how others will see you
                </span>
              </label>
            </div>

            {/* Bio Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio (optional)</span>
                <span className="label-text-alt text-base-content/50">
                  {formData.bio.length}/150
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24 resize-none"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bio: e.target.value.slice(0, 150),
                  })
                }
                disabled={isSubmitting}
                maxLength={150}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting || !formData.nickname.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="btn btn-ghost w-full"
                disabled={isSubmitting}
              >
                Skip for now
              </button>
            </div>
          </form>

          <p className="text-xs text-center text-base-content/50 mt-6">
            You can always update your profile later in Settings
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default SetupProfilePage;
