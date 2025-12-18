import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
  lazy,
  startTransition,
} from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";
import {
  PhoneOff,
  UserPlus,
  SkipForward,
  Loader2,
  Users,
  Clock,
  Shield,
  MessageCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Flag,
  UserCheck,
  Sparkles,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// Lazy load heavy components for faster initial load
const VerifiedBadge = lazy(() => import("../components/VerifiedBadge"));
// Lazy load moderation utilities
let moderationUtils = null;
const loadModerationUtils = async () => {
  if (!moderationUtils) {
    moderationUtils = await import("../utils/contentModeration");
  }
  return moderationUtils;
};
const REPORT_REASONS = [
  "Nudity or Sexual Content",
  "Harassment or Hate Speech",
  "Spam or Scams",
  "Threatening Behavior",
  "Underage User",
  "Other",
];
// Default moderation config (will be overridden by loaded config)
const MODERATION_CONFIG = {
  enabled: false,
  strictMode: false,
  autoReport: true,
};
// Loading Skeleton Component
const LoadingSkeleton = memo(() => (
  <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-gray-900/30 to-black/40 flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-32 h-32 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
      </div>
    </div>
    <div className="mt-8 text-center space-y-2">
      <h3 className="text-2xl font-bold luxury-gradient-text animate-luxury-shimmer">
        Connecting to the world...
      </h3>
      <p className="text-white/80 animate-pulse">Finding your perfect match</p>
    </div>
    <div className="mt-6 flex space-x-2">
      <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
      <div
        className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-3 h-3 bg-white rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  </div>
));
// Enhanced Report Modal
const ReportModal = memo(
  ({ isOpen, onClose, onSubmit, screenshotPreview, isSubmitting }) => {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    useEffect(() => {
      if (isOpen) {
        setReason("");
        setDescription("");
      }
    }, [isOpen]);
    const handleSubmit = useCallback(
      (e) => {
        e.preventDefault();
        if (!reason) {
          toast.error("Please select a reason.");
          return;
        }
        onSubmit(reason, description);
      },
      [reason, description, onSubmit],
    );
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-base-100 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Flag className="w-5 h-5 text-error" />
              Report User
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm mb-4 text-base-content/70">
            Help us keep the community safe. Your report will be reviewed by our
            team.
          </p>
          {screenshotPreview && (
            <div className="mb-4 border border-base-300 rounded-lg overflow-hidden">
              <img
                src={screenshotPreview}
                alt="Report Evidence"
                className="max-h-40 w-full object-contain bg-black"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Reason *</span>
              </label>
              <select
                className="select select-bordered w-full focus:select-primary"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a reason
                </option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Additional Details
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered focus:textarea-primary resize-none"
                placeholder="Provide more context (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-error gap-2"
                disabled={isSubmitting || !reason}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);
// Chat Messages Component
const ChatMessages = memo(({ messages, isVisible }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  if (!isVisible || messages.length === 0) return null;
  return (
    <div className="absolute left-4 bottom-36 max-w-xs z-40 pointer-events-none">
      <div className="bg-base-100/95 backdrop-blur-md rounded-2xl border border-base-300 shadow-xl max-h-64 overflow-y-auto pointer-events-auto">
        <div className="p-3 space-y-2">
          {messages.slice(-5).map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm ${
                msg.sender === "You"
                  ? "text-primary font-medium"
                  : msg.sender === "System"
                    ? "text-warning"
                    : "text-base-content"
              }`}
            >
              <span className="font-semibold">{msg.sender}:</span> {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
});
// Lobby View Component
const LobbyView = memo(({ onStart, isConnecting }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4 z-50">
    <div className="max-w-md w-full text-center space-y-8">
      {/* Logo/Icon */}
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src="/z-logo.png"
            alt="Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          LIVE
        </div>
      </div>
      {/* Title */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-shine bg-[length:200%_auto]">
          Stranger Chat
        </h1>
        <p className="text-lg text-base-content/70">
          Meet verified people from around the world in a safe, moderated
          environment.
        </p>
      </div>
      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="p-4 rounded-xl bg-base-100/5 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-colors">
          <Shield className="w-6 h-6 text-success mb-2" />
          <h3 className="font-semibold text-white">Safe & Secure</h3>
          <p className="text-xs text-base-content/60">
            AI moderation & reporting
          </p>
        </div>
        <div className="p-4 rounded-xl bg-base-100/5 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-colors">
          <Users className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-white">Global Match</h3>
          <p className="text-xs text-base-content/60">Connect with anyone</p>
        </div>
      </div>
      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={isConnecting}
        className="w-full btn btn-lg btn-primary rounded-full shadow-[0_0_40px_-10px_rgba(255,153,51,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,153,51,0.7)] border-none text-xl font-bold transition-all hover:scale-105 active:scale-95"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Starting Camera...
          </>
        ) : (
          <>
            Start Chatting Now
            <Video className="w-6 h-6" />
          </>
        )}
      </button>
      <p className="text-xs text-base-content/40 mt-4">
        By clicking Start, you agree to our Community Guidelines.
        <br />
        Camera and Microphone access required.
      </p>
    </div>
  </div>
));
// Connection Quality Indicator
const ConnectionIndicator = memo(({ quality, isConnected }) => {
  const getQualityColor = () => {
    if (!isConnected) return "text-error";
    switch (quality) {
      case "excellent":
        return "text-success";
      case "good":
        return "text-success";
      case "fair":
        return "text-warning";
      case "poor":
        return "text-error";
      default:
        return "text-base-content/50";
    }
  };
  const getQualityText = () => {
    if (!isConnected) return "Disconnected";
    switch (quality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return "Connecting...";
    }
  };
  return (
    <div className={`flex items-center gap-1 text-xs ${getQualityColor()}`}>
      <div className="flex gap-0.5">
        <div
          className={`w-1 h-3 rounded-full ${quality !== "poor" && isConnected ? "bg-current" : "bg-current/30"}`}
        />
        <div
          className={`w-1 h-3 rounded-full ${["good", "excellent"].includes(quality) && isConnected ? "bg-current" : "bg-current/30"}`}
        />
        <div
          className={`w-1 h-3 rounded-full ${quality === "excellent" && isConnected ? "bg-current" : "bg-current/30"}`}
        />
      </div>
      <span className="font-medium">{getQualityText()}</span>
    </div>
  );
});
// Main Stranger Chat Component
const StrangerChatPage = () => {
  const { authUser, socket } = useAuthStore();
  const {
    getFriendshipStatus,
    fetchFriendData,
    sendFriendRequest,
    acceptFriendRequest,
  } = useFriendStore();
  const navigate = useNavigate();
  // Core States
  const [status, setStatus] = useState("lobby");
  const [partnerUserId, setPartnerUserId] = useState(null);
  const [partnerUserData, setPartnerUserData] = useState(null);
  const [friendStatus, setFriendStatus] = useState("NOT_FRIENDS");
  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    showUsername: true,
    showProfilePic: true,
    showVerificationBadge: true,
    allowFriendRequests: true,
  });
  // UI States
  const [tempMessages, setTempMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [currentMessage, setCurrentMessage] = useState(""); // For stranger chat message input
  const [showChat, setShowChat] = useState(false);
  const [showChatMessages, setShowChatMessages] = useState(false); // Toggle chat visibility
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportScreenshot, setReportScreenshot] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  // Media States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState("good");
  // Stats
  const [chatTime, setChatTime] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(5);
  // AI Moderation
  const [aiWarningCount, setAiWarningCount] = useState(0);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [aiWarningMessage, setAiWarningMessage] = useState("");
  const [aiModerationActive, setAiModerationActive] = useState(false);
  const [moderationConfig, setModerationConfig] = useState({ enabled: false });
  // Reactions & UI
  const [reactions, setReactions] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState("");
  // Refs
  const chatTimerRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const reportTimeoutRef = useRef(null);
  // AI Vision Refs
  const moderationIntervalRef = useRef(null);
  const isScanningRef = useRef(false);
  const violationsRef = useRef(0);
  // Enhanced 4K WebRTC Configuration for ultra-low latency and high quality
  const rtcConfig = useMemo(
    () => ({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.ekiga.net" },
        { urls: "stun:stun.ideasip.com" },
      ],
      iceCandidatePoolSize: 20,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
      iceTransportPolicy: "all",
      sdpSemantics: "unified-plan",
    }),
    [],
  );
  // Ultra-optimized message handler with batching
  const addMessage = useCallback((sender, message) => {
    startTransition(() => {
      setTempMessages((prev) => {
        const newMessage = { sender, message, id: Date.now() };
        return prev.length >= 10
          ? [...prev.slice(-9), newMessage]
          : [...prev, newMessage];
      });
    });
  }, []);
  // Enhanced WebRTC Connection with 4K codec preferences
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);
    // Set codec preferences for better quality
    const transceivers = pc.getTransceivers();
    transceivers.forEach((transceiver) => {
      if (
        transceiver.sender &&
        transceiver.sender.track &&
        transceiver.sender.track.kind === "video"
      ) {
        const params = transceiver.sender.getParameters();
        // Prefer H.264 for better quality and compatibility
        if (params.codecs) {
          params.codecs = params.codecs.sort((a, b) => {
            if (a.mimeType.includes("H264")) return -1;
            if (b.mimeType.includes("H264")) return 1;
            return 0;
          });
          transceiver.sender.setParameters(params);
        }
      }
    });
    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("webrtc:ice-candidate", { candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        remoteStreamRef.current = e.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      }
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      switch (state) {
        case "connected":
          setIsConnected(true);
          setConnectionQuality("excellent");
          toast.success("🎉 Connected! Say hello!");
          addMessage("System", "Video connected successfully!");
          startChatTimer();
          break;
        case "connecting":
          setConnectionQuality("fair");
          addMessage("System", "Establishing video connection...");
          break;
        case "disconnected":
          setIsConnected(false);
          setConnectionQuality("fair");
          break;
        case "failed":
          setIsConnected(false);
          setConnectionQuality("poor");
          toast.error("Connection failed. Reconnecting...");
          // Attempt ICE restart with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          const attemptRestart = () => {
            if (
              pc &&
              pc.connectionState === "failed" &&
              retryCount < maxRetries
            ) {
              retryCount++;
              pc.restartIce();
              setTimeout(attemptRestart, 2000 * retryCount); // Exponential backoff
            } else if (retryCount >= maxRetries) {
              toast.error("Unable to establish connection. Please try again.");
            }
          };
          setTimeout(attemptRestart, 1000);
          break;
      }
    };
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      switch (iceState) {
        case "connected":
        case "completed":
          setIsConnected(true);
          setConnectionQuality("excellent");
          break;
        case "checking":
          setConnectionQuality("fair");
          break;
        case "disconnected":
          setConnectionQuality("poor");
          // Give it time to reconnect
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
            }
          }, 3000);
          break;
        case "failed":
          setIsConnected(false);
          setConnectionQuality("poor");
          // Immediate restart for failed ICE with safety check
          if (pc && pc.signalingState !== "closed") {
            pc.restartIce();
          }
          break;
      }
    };
    // Add local stream tracks with optimized settings
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStreamRef.current);
        if (track.kind === "video") {
          const parameters = sender.getParameters();
          if (!parameters.encodings) parameters.encodings = [{}];
          parameters.encodings[0].maxBitrate = 1000000; // 1 Mbps (Stable)
          parameters.encodings[0].maxFramerate = 30;
          sender.setParameters(parameters).catch(console.warn);
        }
      });
    }
    peerConnectionRef.current = pc;
    return pc;
  }, [socket, rtcConfig, addMessage]);
  // Start chat timer
  const startChatTimer = useCallback(() => {
    if (chatTimerRef.current) clearInterval(chatTimerRef.current);
    setChatTime(0);
    chatTimerRef.current = setInterval(() => {
      setChatTime((prev) => prev + 1);
    }, 1000);
  }, []);
  // Format chat time
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);
  // WebRTC handlers
  const startCall = useCallback(async () => {
    if (!localStreamRef.current) return;
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        voiceActivityDetection: true,
        iceRestart: false,
      });
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", { sdp: offer });
      // Set connection timeout
      setTimeout(() => {
        if (
          pc.connectionState === "connecting" ||
          pc.connectionState === "new"
        ) {
          pc.restartIce();
        }
      }, 10000); // 10 second timeout
    } catch (err) {
      toast.error("Failed to start video call. Trying again...");
      // Retry after short delay
      setTimeout(() => {
        if (localStreamRef.current?.active) {
          startCall();
        }
      }, 2000);
    }
  }, [createPeerConnection, socket]);
  const handleOffer = useCallback(
    async (sdp) => {
      if (!localStreamRef.current?.active) {
        toast.error("Camera not ready. Please refresh.");
        return;
      }
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { sdp: answer });
        // Process queued ICE candidates
        iceCandidateQueueRef.current.forEach((candidate) => {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(
            console.warn,
          );
        });
        iceCandidateQueueRef.current = [];
      } catch (err) {
        toast.error("Connection failed. Skipping to next partner...");
        handleSkip();
      }
    },
    [createPeerConnection, socket],
  );
  const handleAnswer = useCallback(async (sdp) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      iceCandidateQueueRef.current.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      });
      iceCandidateQueueRef.current = [];
    } catch (err) {}
  }, []);
  const handleIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      iceCandidateQueueRef.current.push(candidate);
    } else {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {}
    }
  }, []);
  // Close connection and cleanup
  const closeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    // Clear states
    setTempMessages([]);
    setPartnerUserId(null);
    setPartnerUserData(null);
    setFriendStatus("NOT_FRIENDS");
    setConnectionQuality("good");
    setIsConnected(false);
    setHasUnreadMessages(false);
    iceCandidateQueueRef.current = [];
    // Clear timer
    if (chatTimerRef.current) {
      clearInterval(chatTimerRef.current);
      chatTimerRef.current = null;
    }
    setChatTime(0);
  }, []);
  // Load privacy settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("strangerChatSettings");
    if (savedSettings) {
      setPrivacySettings(JSON.parse(savedSettings));
    }
  }, []);
  // Friend status effect
  useEffect(() => {
    if (partnerUserId) {
      const status = getFriendshipStatus(partnerUserId);
      setFriendStatus(status);
    } else {
      setFriendStatus("NOT_FRIENDS");
    }
  }, [partnerUserId, getFriendshipStatus]);
  // Handle Add Friend
  const handleAddFriend = useCallback(async () => {
    if (!partnerUserId) {
      toast.error("No partner to add");
      return;
    }
    try {
      if (friendStatus === "NOT_FRIENDS") {
        await sendFriendRequest(partnerUserId);
        setFriendStatus("REQUEST_SENT");
        toast.success("Friend request sent! 🎉");
      } else if (friendStatus === "REQUEST_RECEIVED") {
        await acceptFriendRequest(partnerUserId);
        setFriendStatus("FRIENDS");
        toast.success("You are now friends! 🤝");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send request");
    }
  }, [partnerUserId, friendStatus, sendFriendRequest, acceptFriendRequest]);
  // Show reaction picker state
  // Friend button config based on status
  const getFriendButtonConfig = useMemo(() => {
    switch (friendStatus) {
      case "FRIENDS":
        return { text: "Friends", icon: UserCheck, disabled: true };
      case "REQUEST_SENT":
        return { text: "Pending", icon: Clock, disabled: true };
      case "REQUEST_RECEIVED":
        return { text: "Accept", icon: UserCheck, disabled: false };
      default:
        return { text: "Add Friend", icon: UserPlus, disabled: false };
    }
  }, [friendStatus]);
  const optimizeVideoElement = useCallback(() => {
    if (localVideoRef.current) {
      localVideoRef.current.style.willChange = "transform";
      localVideoRef.current.style.backfaceVisibility = "hidden";
      localVideoRef.current.style.transform = "translateZ(0)";
    }
  }, []);
  const initializeCamera = useCallback(async () => {
    if (
      status === "initializing" ||
      status === "waiting" ||
      status === "connected"
    )
      return;
    setHasPermissionError(false);
    setStatus("initializing");
    try {
      // Check device support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser doesn't support camera access");
      }
      // Enhanced 4K media constraints with adaptive quality
      const getMediaStream = async () => {
        // Import video quality optimizer
        const { getOptimalVideoConstraints, getOptimalAudioConstraints } =
          await import("../utils/videoQualityOptimizer.js");
        const constraints = {
          video: getOptimalVideoConstraints(),
          audio: getOptimalAudioConstraints(),
        };
        try {
          // Attempt with ideal constraints and 10s timeout
          const streamPromise =
            navigator.mediaDevices.getUserMedia(constraints);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Camera request timed out")),
              10000,
            ),
          );
          return await Promise.race([streamPromise, timeoutPromise]);
        } catch (err) {
          // Fallback to minimal constraints
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }
      };
      const stream = await getMediaStream();
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        optimizeVideoElement();
        // Reliable video loading
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 2000);
          if (localVideoRef.current.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
          } else {
            localVideoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
            localVideoRef.current.onerror = resolve;
          }
        });
      }
      setStatus("waiting");
      // Join queue immediately after camera setup
      if (socket?.connected) {
        socket.emit("stranger:joinQueue", {
          userId: authUser.id,
          username: privacySettings.showUsername ? authUser.username : null,
          nickname: privacySettings.showUsername ? authUser.nickname : null,
          profilePic: privacySettings.showProfilePic
            ? authUser.profilePic
            : null,
          isVerified: privacySettings.showVerificationBadge
            ? authUser.isVerified
            : false,
          allowFriendRequests: privacySettings.allowFriendRequests,
          privacySettings: privacySettings,
        });
        toast.success("🔍 Searching for someone awesome...");
      }
    } catch (error) {
      setStatus("error");
      setHasPermissionError(true);
      if (error.name === "NotAllowedError") {
        setPermissionErrorMessage(
          "Camera access denied. Please allow permissions in your browser settings.",
        );
        toast.error("Camera access denied. Please allow permissions.");
      } else if (error.name === "NotFoundError") {
        setPermissionErrorMessage("No camera found. Please connect a camera.");
        toast.error("No camera found.");
      } else {
        setPermissionErrorMessage("Failed to access camera: " + error.message);
        toast.error("Camera error. Please check your device.");
      }
    }
  }, [status, socket, authUser, privacySettings, optimizeVideoElement]);
  // Handle Start Chat
  const handleStartChat = useCallback(() => {
    initializeCamera();
  }, [initializeCamera]);
  // Socket event handlers
  const onWaiting = useCallback(() => {
    setStatus((prev) => {
      // Only update to waiting if we are not already connected or error
      if (prev === "connected" || prev === "error") return prev;
      return "waiting";
    });
  }, []);
  // Socket event handlers (Moved outside useEffect to be stable)
  useEffect(() => {
    if (!socket) return;
    let isMounted = true;
    const onMatched = (data) => {
      if (isMounted) {
        addMessage("System", "🎉 Partner found! Connecting...");
        setStatus("connected");
        setPartnerUserId(data.partnerUserId);
        setPartnerUserData(data.partnerUserData);
        const shouldInitiate = socket.id < data.partnerId;
        if (shouldInitiate) {
          // Start call immediately for faster connection
          if (isMounted && localStreamRef.current?.active) {
            startCall();
          } else {
            // Fallback with short delay if stream not ready
            setTimeout(() => {
              if (isMounted && localStreamRef.current?.active) {
                startCall();
              }
            }, 100);
          }
        }
      }
    };
    const onDisconnected = () => {
      if (isMounted) {
        addMessage("System", "👋 Partner left. Finding new match...");
        toast("Partner disconnected", { icon: "👋" });
        closeConnection();
        setStatus("waiting");
        if (socket?.connected) {
          socket.emit("stranger:joinQueue", { userId: authUser.id });
        }
      }
    };
    const onChatMessage = (payload) => {
      if (isMounted) {
        addMessage("Stranger", payload.message);
        // Show notification badge if chat is not visible
        if (!showChatMessages) {
          setHasUnreadMessages(true);
        }
      }
    };
    const onFriendRequest = () => {
      if (isMounted) {
        toast.success("📨 Friend request received!");
        fetchFriendData();
      }
    };
    const onFriendRequestSent = () => {
      if (isMounted) {
        toast.success("✅ Friend request sent!");
        fetchFriendData();
      }
    };
    const onReaction = ({ emoji }) => {
      if (isMounted) {
        const reaction = {
          id: Date.now() + Math.random(),
          emoji,
          x: Math.random() * 80 + 10,
        };
        setReactions((prev) => [...prev, reaction]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 3000);
      }
    };
    const onQueueStats = (data) => {
      if (isMounted && data.onlineCount !== undefined) {
        setOnlineCount(data.onlineCount);
      }
    };
    // WebRTC handlers
    const onOffer = (payload) => {
      if (isMounted) handleOffer(payload.sdp);
    };
    const onAnswer = (payload) => {
      if (isMounted) handleAnswer(payload.sdp);
    };
    const onIce = (payload) => {
      if (isMounted) handleIceCandidate(payload.candidate);
    };
    // Error handlers
    const onAddFriendError = ({ error }) => {
      if (isMounted) toast.error(error);
    };
    const onReportSuccess = ({ message }) => {
      if (isMounted) {
        // Clear timeout
        if (reportTimeoutRef.current) {
          clearTimeout(reportTimeoutRef.current);
          reportTimeoutRef.current = null;
        }
        toast.success(message || "Report submitted successfully");
        setIsSubmittingReport(false);
        setIsReportModalOpen(false);
        setReportScreenshot(null); // Clear screenshot after successful report
      }
    };
    const onReportError = ({ error }) => {
      if (isMounted) {
        // Clear timeout
        if (reportTimeoutRef.current) {
          clearTimeout(reportTimeoutRef.current);
          reportTimeoutRef.current = null;
        }
        toast.error(error || "Failed to submit report");
        setIsSubmittingReport(false);
        // Keep modal open so user can try again
      }
    };
    // Register all socket listeners
    socket.on("stranger:waiting", onWaiting);
    socket.on("stranger:matched", onMatched);
    socket.on("stranger:disconnected", onDisconnected);
    socket.on("stranger:chatMessage", onChatMessage);
    socket.on("stranger:friendRequest", onFriendRequest);
    socket.on("stranger:friendRequestSent", onFriendRequestSent);
    socket.on("stranger:reaction", onReaction);
    socket.on("stranger:queueStats", onQueueStats);
    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice-candidate", onIce);
    socket.on("stranger:addFriendError", onAddFriendError);
    socket.on("stranger:report_success", onReportSuccess);
    socket.on("stranger:report_error", onReportError);
    return () => {
      isMounted = false;
      // Cleanup media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      // Clear report timeout
      if (reportTimeoutRef.current) {
        clearTimeout(reportTimeoutRef.current);
        reportTimeoutRef.current = null;
      }
      closeConnection();
      if (socket?.connected) {
        socket.emit("stranger:skip");
      }
      // Remove all listeners
      socket.off("stranger:waiting", onWaiting);
      socket.off("stranger:matched", onMatched);
      socket.off("stranger:disconnected", onDisconnected);
      socket.off("stranger:chatMessage", onChatMessage);
      socket.off("stranger:friendRequest", onFriendRequest);
      socket.off("stranger:friendRequestSent", onFriendRequestSent);
      socket.off("stranger:reaction", onReaction);
      socket.off("stranger:queueStats", onQueueStats);
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice-candidate", onIce);
      socket.off("stranger:addFriendError", onAddFriendError);
      socket.off("stranger:report_success", onReportSuccess);
      socket.off("stranger:report_error", onReportError);
    };
  }, [
    socket,
    authUser,
    navigate,
    addMessage,
    closeConnection,
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    fetchFriendData,
  ]);
  // Initialize AI moderation lazily
  useEffect(() => {
    const initModeration = async () => {
      try {
        const { MODERATION_CONFIG: config, initNSFWModel } =
          await loadModerationUtils();
        setModerationConfig(config);
        if (config.enabled) {
          await initNSFWModel();
          setAiModerationActive(true);
        }
      } catch (error) {
        setAiModerationActive(false);
      }
    };
    // Delay moderation loading to not block initial render
    setTimeout(initModeration, 1000);
  }, []);
  // Action handlers
  const handleSkip = useCallback(() => {
    if (status === "initializing") return;
    if (status === "connected") {
      addMessage("System", "⏭️ Skipping to next person...");
    }
    socket?.emit("stranger:skip");
    closeConnection();
    setStatus("waiting");
    // Immediately rejoin queue for faster matching with privacy settings
    setTimeout(() => {
      if (socket?.connected) {
        socket.emit("stranger:joinQueue", {
          userId: authUser.id,
          username: privacySettings.showUsername ? authUser.username : null,
          nickname: privacySettings.showUsername ? authUser.nickname : null,
          profilePic: privacySettings.showProfilePic
            ? authUser.profilePic
            : null,
          isVerified: privacySettings.showVerificationBadge
            ? authUser.isVerified
            : false,
          allowFriendRequests: privacySettings.allowFriendRequests,
          privacySettings: privacySettings,
        });
      }
    }, 100);
    toast("🔄 Finding new match...", { icon: "⏭️" });
  }, [status, socket, closeConnection, addMessage, authUser]);
  // --- AI VIDEO MODERATION LOOP (Fixed) ---
  useEffect(() => {
    let isRunning = true;
    const runModeration = async () => {
      // Load lazily to prevent blocking
      if (!privacySettings.enableAIModeration && !MODERATION_CONFIG.enabled)
        return;
      try {
        const utils = await loadModerationUtils();
        if (!isRunning) return;
        // Initialize model if not ready
        await utils.initNSFWModel();
        setAiModerationActive(true);
        // 1. Check Local Stream (Outgoing)
        if (
          localVideoRef.current &&
          localVideoRef.current.readyState === 4 &&
          localStreamRef.current?.active
        ) {
          const analysis = await utils.analyzeFrame(localVideoRef.current);
          if (!analysis.safe) {
            // 📸 Capture evidence immediately
            const screenshot = utils.captureVideoFrame(localVideoRef.current);
            // 🚨 ZERO TOLERANCE: Instant Disconnect & Report
            // Don't just warn, take action.
            toast.error(
              analysis.violationType === "explicit"
                ? "🚫 BANNED: Nudity detected!"
                : "⚠️ Disconnected: Inappropriate camera content detected.",
              { duration: 5000, icon: "🛡️" },
            );
            // Report to server
            if (socket?.connected && screenshot) {
              socket.emit("stranger:report", {
                reporterId: "SYSTEM_AI",
                reportedUserId: authUser.id, // Self-report
                reason: "AI_AUTO_BAN",
                description: `AI detected ${analysis.violationType} content (${analysis.highestRisk.className}: ${(analysis.highestRisk.probability * 100).toFixed(1)}%)`,
                screenshot: screenshot, // Send evidence
                category: "ai_violation",
                isAIDetected: true,
              });
            }
            // show modal or redirect
            // Only strict ban for explicit content with high confidence
            if (
              analysis.violationType === "explicit" &&
              analysis.highestRisk.probability > 0.9
            ) {
              // Strict ban
              closeConnection();
              navigate("/");
              toast.error("🚫 BANNED: Explicit content detected.");
            } else {
              // Soft warning for lower confidence or suggestive content
              // setStatus("error"); // Optional: soft kick to error screen
              // Just warn the user without disconnecting
              toast(
                "Your video may contain inappropriate content. Please ensure you are fully clothed.",
                { icon: "⚠️", duration: 4000 },
              );
            }
          }
        }
        // 2. Check Remote Stream (Incoming)
        if (
          remoteVideoRef.current &&
          remoteVideoRef.current.readyState === 4 &&
          isConnected
        ) {
          const analysis = await utils.analyzeFrame(remoteVideoRef.current);
          if (!analysis.safe) {
            // BLUR IMMEDIATELY
            remoteVideoRef.current.style.filter = "blur(50px) grayscale(100%)"; // Heavy blur
            // 📸 Capture evidence
            const screenshot = utils.captureVideoFrame(remoteVideoRef.current);
            // Auto-report & Disconnect
            if (!reportTimeoutRef.current) {
              toast("🛡️ Partner banned for inappropriate content.", {
                icon: "👮",
              });
              // Auto report to backend
              if (socket?.connected && screenshot) {
                socket.emit("stranger:report", {
                  reporterId: authUser.id,
                  reportedUserId: partnerUserId,
                  reason: "AI_REMOTE_DETECT",
                  description: `Auto-reporting partner for ${analysis.violationType} content.`,
                  screenshot: screenshot,
                  category: "ai_violation",
                  isAIDetected: true,
                });
              }
              // Disconnect immediately
              // Disconnect immediately ONLY if high confidence
              if (
                analysis.violationType === "explicit" &&
                analysis.highestRisk.probability > 0.9
              ) {
                setTimeout(() => {
                  closeConnection();
                  setStatus("waiting");
                  socket.emit("stranger:joinQueue", { userId: authUser.id });
                  toast.error("Partner banned: Explicit content.");
                }, 500);
              } else {
                // Just warn for suspicious content
                toast(
                  "⚠️ Partner video flagged as potentially inappropriate.",
                  { icon: "🛡️" },
                );
              }
              reportTimeoutRef.current = setTimeout(() => {
                reportTimeoutRef.current = null;
              }, 10000);
            }
          } else {
            remoteVideoRef.current.style.filter = "none";
          }
        }
      } catch (err) {
        setAiModerationActive(false);
      }
    };
    // Run every 3 seconds to save battery/performance
    const intervalId = setInterval(runModeration, 3000);
    return () => {
      isRunning = false;
      clearInterval(intervalId);
    };
  }, [isConnected, privacySettings, navigate]);
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!currentMessage.trim() || status !== "connected") return;
      socket?.emit("stranger:chatMessage", { message: currentMessage });
      addMessage("You", currentMessage);
      setCurrentMessage("");
    },
    [currentMessage, status, socket, addMessage],
  );
  // Handle chat toggle and clear unread messages
  const handleChatToggle = useCallback(() => {
    setShowChatMessages(!showChatMessages);
    if (!showChatMessages) {
      setHasUnreadMessages(false); // Clear notification when opening chat
    }
  }, [showChatMessages]);
  const captureScreenshot = useCallback(() => {
    if (!remoteVideoRef.current) {
      toast.error("Cannot capture screenshot - video element not found.");
      return null;
    }
    if (
      remoteVideoRef.current.videoWidth === 0 ||
      remoteVideoRef.current.videoHeight === 0
    ) {
      toast.error("Cannot capture screenshot - partner video not ready.");
      return null;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = remoteVideoRef.current.videoWidth;
      canvas.height = remoteVideoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(remoteVideoRef.current, 0, 0);
      const screenshot = canvas.toDataURL("image/jpeg", 0.9);
      return screenshot;
    } catch (error) {
      toast.error("Failed to capture screenshot. Please try again.");
      return null;
    }
  }, []);
  const handleReport = useCallback(() => {
    const screenshot = captureScreenshot();
    if (screenshot) {
      setReportScreenshot(screenshot);
      setIsReportModalOpen(true);
    } else {
    }
  }, [captureScreenshot]);
  const handleSubmitReport = useCallback(
    (reason, description) => {
      if (!reportScreenshot || !reason || !partnerUserId) {
        toast.error("Missing report information");
        return;
      }
      setIsSubmittingReport(true);
      // Emit report event
      if (socket && socket.connected) {
        const reportData = {
          reporterId: authUser.id,
          reportedUserId: partnerUserId,
          reason,
          description: description || `Manual report: ${reason}`,
          screenshot: reportScreenshot,
          category: "stranger_chat",
          isAIDetected: false,
        };
        socket.emit("stranger:report", reportData);
        // Set a fallback timeout in case server doesn't respond
        reportTimeoutRef.current = setTimeout(() => {
          toast.error(
            "Report submission timed out, but admins may still review it.",
          );
          setIsSubmittingReport(false);
          setShowReportModal(false);
        }, 10000);
      } else {
        toast.error("Connection lost. Cannot submit report.");
        setIsSubmittingReport(false);
      }
    },
    [reportScreenshot, partnerUserId, authUser, socket],
  );
  const sendReaction = useCallback(
    (emoji) => {
      const reaction = {
        id: Date.now() + Math.random(),
        emoji,
        x: Math.random() * 80 + 10,
      };
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
      if (socket && status === "connected") {
        socket.emit("stranger:reaction", { emoji });
      }
    },
    [socket, status],
  );
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, []);
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);
  return (
    <div className="fixed w-full h-[100dvh] flex flex-col bg-gradient-to-br from-base-300 via-base-200 to-base-300 overflow-hidden">
      {/* Lobby / Start Screen */}
      {(status === "lobby" || status === "error") && (
        <LobbyView
          onStart={handleStartChat}
          isConnecting={status === "initializing"}
        />
      )}
      {/* Permission Error - Adjusted z-index and top position */}
      {status === "error" && hasPermissionError && (
        <div className="absolute top-20 left-0 right-0 z-[60] px-4 pointer-events-none">
          <div className="alert alert-error shadow-lg max-w-lg mx-auto pointer-events-auto">
            <div className="flex flex-col">
              <span className="font-bold flex items-center gap-2">
                <VideoOff className="w-5 h-5" />
                Permission Error
              </span>
              <span className="text-sm">{permissionErrorMessage}</span>
              <button
                className="btn btn-sm btn-outline mt-2 bg-white/20 text-white"
                onClick={() => setStatus("lobby")}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loading */}
      {status === "initializing" && !hasPermissionError && <LoadingSkeleton />}
      {/* Main Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="absolute inset-0 w-full h-full object-cover bg-gradient-to-br from-primary/10 to-secondary/10"
          style={{
            filter: status === "waiting" ? "blur(20px)" : "none",
            transition: "filter 0.3s ease",
            willChange: "filter",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        />
        {/* Waiting Overlay */}
        {status === "waiting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/50 via-gray-900/30 to-black/50 backdrop-blur-md px-4">
            <div className="text-center space-y-6 p-8 w-full max-w-sm">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                <Users className="absolute inset-0 m-auto w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold luxury-gradient-text animate-luxury-shimmer">
                  Finding Match
                </h2>
                <p className="text-white/80 text-sm sm:text-base">
                  Connecting you with someone amazing...
                </p>
                {onlineCount > 0 && (
                  <p className="text-xs sm:text-sm text-white/60">
                    {onlineCount} people online
                  </p>
                )}
              </div>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      i === 1 ? "bg-yellow-400" : "bg-white"
                    }`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Floating Reactions - Move up slightly */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute bottom-24 sm:bottom-0 animate-float-up text-4xl"
              style={{
                left: `${reaction.x}%`,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>
        {/* Top Status Bar - Compact on Mobile */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent pb-4">
          <div className="flex items-center justify-between p-3 sm:p-4">
            {/* Left: AI/Connection */}
            <div className="flex items-center gap-2">
              {MODERATION_CONFIG.enabled && (
                <div
                  className={`badge badge-sm sm:badge-md gap-1 ${aiModerationActive ? "badge-success" : "badge-warning"}`}
                >
                  <Shield className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {aiModerationActive ? "Protected" : "Loading"}
                  </span>
                </div>
              )}
              {/* Connection indicator simplified on mobile */}
              {status === "connected" && (
                <div
                  className={`w-2 h-2 rounded-full ${connectionQuality === "good" ? "bg-green-500" : connectionQuality === "poor" ? "bg-yellow-500" : "bg-red-500"}`}
                ></div>
              )}
            </div>
            {/* Center: Partner Info */}
            {status === "connected" && partnerUserData && (
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 max-w-[150px] sm:max-w-none justify-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/50 shrink-0">
                  {partnerUserData.profilePic ? (
                    <img
                      src={partnerUserData.profilePic}
                      alt={partnerUserData.displayName || "Stranger"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-semibold text-white text-xs sm:text-sm truncate">
                  {partnerUserData.displayName || "Stranger"}
                </span>
                {/* {chatTime > 0 && (
									<div className="flex items-center gap-0.5 text-white/70 text-[10px] sm:text-xs shrink-0">
										<Clock className="w-2.5 h-2.5" />
										{formatTime(chatTime)}
									</div>
								)} */}
              </div>
            )}
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {status === "connected" && (
                <>
                  <button
                    onClick={handleChatToggle}
                    className="btn btn-circle btn-sm bg-black/40 border-white/20 text-white hover:bg-black/60 relative"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {hasUnreadMessages && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></div>
                    )}
                  </button>
                  <button
                    onClick={handleReport}
                    className="btn btn-circle btn-sm bg-red-500/80 border-red-400/50 text-white hover:bg-red-600"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Self Video - Smaller & repositioned on mobile */}
        <div className="absolute top-16 right-3 sm:top-20 sm:right-4 z-30">
          <div className="relative w-24 h-36 sm:w-36 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-black/20 backdrop-blur-sm transition-all duration-300">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              className="w-full h-full object-cover"
              style={{
                transform: "scaleX(-1) translateZ(0)",
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            />
            {/* Video controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 sm:p-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-[10px] sm:text-xs font-medium">
                  You
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={toggleVideo}
                    className={`btn btn-circle btn-xs ${isVideoMuted ? "btn-error" : "btn-ghost"} text-white w-5 h-5 min-h-0 sm:w-6 sm:h-6`}
                  >
                    {isVideoMuted ? (
                      <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`btn btn-circle btn-xs ${isAudioMuted ? "btn-error" : "btn-ghost"} text-white w-5 h-5 min-h-0 sm:w-6 sm:h-6`}
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Chat Messages */}
        <ChatMessages messages={tempMessages} isVisible={showChatMessages} />
        {/* Message Input - Adjusted position */}
        {status === "connected" && showChatMessages && (
          <div className="absolute left-2 right-2 bottom-20 sm:left-4 sm:bottom-20 sm:w-auto sm:max-w-xs z-50 message-input-container">
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 message-input-container"
            >
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type..."
                className="input input-sm input-bordered flex-1 bg-base-100/95 backdrop-blur-md border-base-300 focus:border-primary focus:outline-none shadow-lg text-sm"
                maxLength={200}
                autoComplete="off"
                autoFocus={showChatMessages}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim()}
                className="btn btn-sm btn-primary shadow-lg"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        )}
        {/* Reaction Emoji Picker - Drop-up Animation */}
        {status === "connected" && (
          <div className="absolute bottom-28 sm:bottom-36 right-4 z-40">
            {/* Emoji Picker Drop-up */}
            <div
              className={`absolute bottom-full right-0 mb-2 transition-all duration-300 origin-bottom-right ${showReactionPicker ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
            >
              <div className="flex gap-2 bg-base-100/95 backdrop-blur-md rounded-2xl px-3 py-2 border border-base-300 shadow-xl">
                {["❤️", "👍", "😂", "🎉", "😊", "🔥"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setShowReactionPicker(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/20 active:scale-90 transition-all duration-200"
                  >
                    <span className="text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Toggle Button */}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`btn btn-circle btn-md backdrop-blur-md shadow-lg transition-all duration-300 ${showReactionPicker ? "bg-primary text-primary-content" : "bg-white/10 border border-white/20 text-white hover:bg-white/20"}`}
            >
              <span className="text-xl">{showReactionPicker ? "✕" : "😊"}</span>
            </button>
          </div>
        )}
        {/* Bottom Control Bar - Professional Glass Design */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none pb-safe">
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-5 pb-5 sm:pb-7 pointer-events-auto w-full max-w-xl mx-auto">
            {/* Skip/Next Button - Glass Outline */}
            <button
              onClick={handleSkip}
              disabled={status === "initializing"}
              className={`btn btn-md sm:btn-lg flex-1 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 font-semibold backdrop-blur-md border-2 ${
                status === "waiting"
                  ? "bg-white/5 border-white/30 text-white hover:bg-white/15 hover:border-white/50"
                  : "bg-primary/10 border-primary/50 text-primary hover:bg-primary/20 hover:border-primary"
              }`}
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-sm sm:text-base">
                {status === "connected"
                  ? "Next"
                  : status === "waiting"
                    ? "Searching..."
                    : "Start"}
              </span>
            </button>
            {/* Add Friend Button - Always show when connected */}
            {status === "connected" && (
              <button
                onClick={handleAddFriend}
                disabled={getFriendButtonConfig?.disabled || !partnerUserId}
                className={`btn btn-md sm:btn-lg gap-2 backdrop-blur-md border-2 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 ${
                  getFriendButtonConfig?.disabled
                    ? "bg-success/10 border-success/50 text-success cursor-not-allowed"
                    : "bg-secondary/10 border-secondary/50 text-secondary hover:bg-secondary/20 hover:border-secondary"
                }`}
                title={getFriendButtonConfig?.text || "Add Friend"}
              >
                {getFriendButtonConfig?.icon ? (
                  <getFriendButtonConfig.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="hidden sm:inline font-semibold">
                  {getFriendButtonConfig?.text || "Add Friend"}
                </span>
              </button>
            )}
            {/* Report Button - Subtle */}
            {status === "connected" && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="btn btn-md sm:btn-lg btn-circle backdrop-blur-md bg-white/5 border-2 border-white/20 text-white/70 hover:bg-error/10 hover:border-error/50 hover:text-error shadow-lg transition-all duration-300 active:scale-95"
                title="Report User"
              >
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            {/* Leave Button - Glass Outline Error */}
            <button
              onClick={() => navigate("/")}
              className="btn btn-md sm:btn-lg flex-1 gap-2 backdrop-blur-md bg-error/10 border-2 border-error/50 text-error hover:bg-error/20 hover:border-error shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">Leave</span>
            </button>
          </div>
        </div>
      </div>
      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSubmitReport}
        screenshotPreview={reportScreenshot}
        isSubmitting={isSubmittingReport}
      />
      {/* Custom Styles */}
      <style>{`
				@keyframes float-up {
					0% {
						transform: translateY(0) scale(0);
						opacity: 0;
					}
					10% {
						transform: translateY(-30px) scale(1);
						opacity: 1;
					}
					90% {
						transform: translateY(-400px) scale(1.2) rotate(15deg);
						opacity: 0.7;
					}
					100% {
						transform: translateY(-500px) scale(0.5) rotate(25deg);
						opacity: 0;
					}
				}
				.animate-float-up {
					animation: float-up 3s ease-out forwards;
				}
				/* Fix for message input interaction */
				.message-input-container {
					pointer-events: auto !important;
					touch-action: manipulation !important;
				}
				.message-input-container input {
					pointer-events: auto !important;
					user-select: text !important;
					-webkit-user-select: text !important;
					-moz-user-select: text !important;
					-ms-user-select: text !important;
					touch-action: manipulation !important;
				}
				.message-input-container button {
					pointer-events: auto !important;
					touch-action: manipulation !important;
				}
			`}</style>
    </div>
  );
};
export default StrangerChatPage;
