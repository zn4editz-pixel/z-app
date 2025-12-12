import { useState } from "react";
import { BadgeCheck, X, Loader2, Upload } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const VerificationRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [idProof, setIdProof] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setIdProof(reader.result);
      setIdProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    if (!idProof) {
      toast.error("Please upload ID proof");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/users/request-verification", {
        reason: reason.trim(),
        idProof,
      });

      toast.success("Verification request submitted!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Verification request error:", error);
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Request Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              Verification Badge
            </h3>
            <p className="text-sm text-base-content/70">
              Get a blue checkmark next to your name to show you're verified. This helps others know you're authentic.
            </p>
          </div>

          {/* Reason */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Why do you want to be verified?</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="I'm a content creator, public figure, business, etc..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* ID Proof Upload */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Upload ID Proof</span>
            </label>
            <div className="border-2 border-dashed border-base-300 rounded-lg p-4 text-center">
              {idProofPreview ? (
                <div className="relative">
                  <img
                    src={idProofPreview}
                    alt="ID Proof"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIdProof(null);
                      setIdProofPreview(null);
                    }}
                    className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-base-content/40" />
                  <p className="text-sm text-base-content/70 mb-2">
                    Click to upload ID proof
                  </p>
                  <p className="text-xs text-base-content/50">
                    Government ID, passport, or official document
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="text-xs text-base-content/60 bg-base-200 p-3 rounded-lg">
            <strong>Note:</strong> Your information will be reviewed by our team. This process may take 1-3 business days.
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 gap-2"
              disabled={isSubmitting || !reason.trim() || !idProof}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationRequestModal;
