import { useEffect, useState, useRef, useCallback, useMemo, memo, lazy, startTransition } from "react";
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
	X
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
			<div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
			<div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
		</div>
	</div>
));

// Enhanced Report Modal
const ReportModal = memo(({ isOpen, onClose, onSubmit, screenshotPreview, isSubmitting }) => {
	const [reason, setReason] = useState("");
	const [description, setDescription] = useState("");
	
	useEffect(() => { 
		if (isOpen) {
			setReason("");
			setDescription("");
		}
	}, [isOpen]);
	
	const handleSubmit = useCallback((e) => {
		e.preventDefault();
		if (!reason) { 
			toast.error("Please select a reason."); 
			return; 
		}
		onSubmit(reason, description);
	}, [reason, description, onSubmit]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
			<div className="bg-base-100 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold flex items-center gap-2">
						<Flag className="w-5 h-5 text-error" />
						Report User
					</h2>
					<button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
						<X className="w-4 h-4" />
					</button>
				</div>
				
				<p className="text-sm mb-4 text-base-content/70">
					Help us keep the community safe. Your report will be reviewed by our team.
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
							<option value="" disabled>Select a reason</option>
							{REPORT_REASONS.map((r) => (
								<option key={r} value={r}>{r}</option>
							))}
						</select>
					</div>
					
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Additional Details</span>
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
});

// Chat Messages Component
const ChatMessages = memo(({ messages, isVisible }) => {
	const messagesEndRef = useRef(null);
	
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);
	
	if (!isVisible || messages.length === 0) return null;
	
	return (
		<div className="absolute left-4 bottom-32 max-w-xs z-20">
			<div className="bg-base-100/95 backdrop-blur-md rounded-2xl border border-base-300 shadow-xl max-h-64 overflow-y-auto">
				<div className="p-3 space-y-2">
					{messages.slice(-5).map((msg, idx) => (
						<div key={idx} className={`text-sm ${
							msg.sender === 'You' ? 'text-primary font-medium' : 
							msg.sender === 'System' ? 'text-warning' : 'text-base-content'
						}`}>
							<span className="font-semibold">{msg.sender}:</span> {msg.message}
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>
		</div>
	);
});

// Connection Quality Indicator
const ConnectionIndicator = memo(({ quality, isConnected }) => {
	const getQualityColor = () => {
		if (!isConnected) return 'text-error';
		switch (quality) {
			case 'excellent': return 'text-success';
			case 'good': return 'text-success';
			case 'fair': return 'text-warning';
			case 'poor': return 'text-error';
			default: return 'text-base-content/50';
		}
	};
	
	const getQualityText = () => {
		if (!isConnected) return 'Disconnected';
		switch (quality) {
			case 'excellent': return 'Excellent';
			case 'good': return 'Good';
			case 'fair': return 'Fair';
			case 'poor': return 'Poor';
			default: return 'Connecting...';
		}
	};
	
	return (
		<div className={`flex items-center gap-1 text-xs ${getQualityColor()}`}>
			<div className="flex gap-0.5">
				<div className={`w-1 h-3 rounded-full ${quality !== 'poor' && isConnected ? 'bg-current' : 'bg-current/30'}`} />
				<div className={`w-1 h-3 rounded-full ${['good', 'excellent'].includes(quality) && isConnected ? 'bg-current' : 'bg-current/30'}`} />
				<div className={`w-1 h-3 rounded-full ${quality === 'excellent' && isConnected ? 'bg-current' : 'bg-current/30'}`} />
			</div>
			<span className="font-medium">{getQualityText()}</span>
		</div>
	);
});

// Main Stranger Chat Component
const StrangerChatPage = () => {
	const { authUser, socket } = useAuthStore();
	const { getFriendshipStatus, fetchFriendData, sendFriendRequest, acceptFriendRequest } = useFriendStore();
	const navigate = useNavigate();

	// Core States
	const [status, setStatus] = useState("initializing");
	const [tempMessages, setTempMessages] = useState([]);
	const [currentMessage, setCurrentMessage] = useState("");
	const [partnerUserId, setPartnerUserId] = useState(null);
	const [partnerUserData, setPartnerUserData] = useState(null);
	const [friendStatus, setFriendStatus] = useState("NOT_FRIENDS");
	
	// Privacy Settings
	const [privacySettings, setPrivacySettings] = useState({
		showUsername: true,
		showProfilePic: true,
		showVerificationBadge: true,
		allowFriendRequests: true
	});
	
	// UI States
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [reportScreenshot, setReportScreenshot] = useState(null);
	const [isSubmittingReport, setIsSubmittingReport] = useState(false);
	const [showChatMessages, setShowChatMessages] = useState(false);
	const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
	
	// Media States
	const [isVideoMuted, setIsVideoMuted] = useState(false);
	const [isAudioMuted, setIsAudioMuted] = useState(false);
	const [connectionQuality, setConnectionQuality] = useState("good");
	const [isConnected, setIsConnected] = useState(false);
	
	// Stats
	const [chatTime, setChatTime] = useState(0);
	const [onlineCount, setOnlineCount] = useState(0);
	const [reactions, setReactions] = useState([]);
	
	// AI Moderation
	const [aiModerationActive, setAiModerationActive] = useState(false);
	
	// Refs
	const chatTimerRef = useRef(null);
	const peerConnectionRef = useRef(null);
	const localStreamRef = useRef(null);
	const remoteStreamRef = useRef(null);
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const iceCandidateQueueRef = useRef([]);

	// Optimized WebRTC Configuration for faster connections
	const rtcConfig = useMemo(() => ({
		iceServers: [
			{ urls: "stun:stun.l.google.com:19302" },
			{ urls: "stun:stun1.l.google.com:19302" },
			{ urls: "stun:stun2.l.google.com:19302" },
			{
				urls: "turn:a.relay.metered.ca:80",
				username: "87e69d452a19d7be8c0a6c70",
				credential: "uBqeBEI+0xKJYEHm"
			},
			{
				urls: "turn:a.relay.metered.ca:80?transport=tcp",
				username: "87e69d452a19d7be8c0a6c70",
				credential: "uBqeBEI+0xKJYEHm"
			},
			{
				urls: "turn:a.relay.metered.ca:443",
				username: "87e69d452a19d7be8c0a6c70",
				credential: "uBqeBEI+0xKJYEHm"
			}
		],
		iceCandidatePoolSize: 10,
		bundlePolicy: 'max-bundle',
		rtcpMuxPolicy: 'require',
		iceTransportPolicy: 'all'
	}), []);

	// Ultra-optimized message handler with batching
	const addMessage = useCallback((sender, message) => {
		startTransition(() => {
			setTempMessages(prev => {
				const newMessage = { sender, message, id: Date.now() };
				return prev.length >= 10 ? [...prev.slice(-9), newMessage] : [...prev, newMessage];
			});
		});
	}, []);

	// Enhanced WebRTC Connection
	const createPeerConnection = useCallback(() => {
		console.log("🚀 Creating optimized peer connection");
		const pc = new RTCPeerConnection(rtcConfig);

		pc.onicecandidate = (e) => {
			if (e.candidate && socket) {
				socket.emit("webrtc:ice-candidate", { candidate: e.candidate });
			}
		};

		pc.ontrack = (e) => {
			if (e.streams && e.streams[0]) {
				console.log("📺 Remote stream received");
				remoteStreamRef.current = e.streams[0];
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = e.streams[0];
				}
			}
		};

		pc.onconnectionstatechange = () => {
			const state = pc.connectionState;
			console.log("🔗 Connection state:", state);
			
			switch (state) {
				case 'connected':
					setIsConnected(true);
					setConnectionQuality("excellent");
					toast.success("🎉 Connected! Say hello!");
					addMessage("System", "Video connected successfully!");
					startChatTimer();
					break;
				case 'connecting':
					setConnectionQuality("fair");
					addMessage("System", "Establishing video connection...");
					break;
				case 'disconnected':
					setIsConnected(false);
					setConnectionQuality("fair");
					console.warn("⚠️ Connection disconnected, waiting for reconnection...");
					break;
				case 'failed':
					setIsConnected(false);
					setConnectionQuality("poor");
					console.error("❌ Connection failed, attempting restart...");
					toast.error("Connection failed. Reconnecting...");
					// Attempt ICE restart
					setTimeout(() => {
						if (pc.connectionState === 'failed') {
							pc.restartIce();
						}
					}, 1000);
					break;
			}
		};

		pc.oniceconnectionstatechange = () => {
			const iceState = pc.iceConnectionState;
			console.log("🧊 ICE connection state:", iceState);
			
			switch (iceState) {
				case 'connected':
				case 'completed':
					setIsConnected(true);
					setConnectionQuality("excellent");
					break;
				case 'checking':
					setConnectionQuality("fair");
					break;
				case 'disconnected':
					setConnectionQuality("poor");
					// Give it time to reconnect
					setTimeout(() => {
						if (pc.iceConnectionState === 'disconnected') {
							console.warn("⚠️ ICE still disconnected, may need to restart");
						}
					}, 3000);
					break;
				case 'failed':
					setIsConnected(false);
					setConnectionQuality("poor");
					console.error("❌ ICE connection failed");
					// Immediate restart for failed ICE
					pc.restartIce();
					break;
			}
		};

		// Add local stream tracks with optimized settings
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				const sender = pc.addTrack(track, localStreamRef.current);
				
				if (track.kind === 'video') {
					const parameters = sender.getParameters();
					if (!parameters.encodings) parameters.encodings = [{}];
					parameters.encodings[0].maxBitrate = 2500000; // 2.5 Mbps
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
			setChatTime(prev => prev + 1);
		}, 1000);
	}, []);

	// Format chat time
	const formatTime = useCallback((seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
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
				iceRestart: false
			});
			
			await pc.setLocalDescription(offer);
			socket.emit("webrtc:offer", { sdp: offer });
			
			// Set connection timeout
			setTimeout(() => {
				if (pc.connectionState === 'connecting' || pc.connectionState === 'new') {
					console.warn("⚠️ Connection timeout, restarting...");
					pc.restartIce();
				}
			}, 10000); // 10 second timeout
			
		} catch (err) {
			console.error("❌ Offer creation failed:", err);
			toast.error("Failed to start video call. Trying again...");
			
			// Retry after short delay
			setTimeout(() => {
				if (localStreamRef.current?.active) {
					startCall();
				}
			}, 2000);
		}
	}, [createPeerConnection, socket]);

	const handleOffer = useCallback(async (sdp) => {
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
			iceCandidateQueueRef.current.forEach(candidate => {
				pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
			});
			iceCandidateQueueRef.current = [];
		} catch (err) {
			console.error("❌ Answer creation failed:", err);
			toast.error("Connection failed. Skipping to next partner...");
			handleSkip();
		}
	}, [createPeerConnection, socket]);

	const handleAnswer = useCallback(async (sdp) => {
		const pc = peerConnectionRef.current;
		if (!pc) return;

		try {
			await pc.setRemoteDescription(new RTCSessionDescription(sdp));
			iceCandidateQueueRef.current.forEach(candidate => {
				pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
			});
			iceCandidateQueueRef.current = [];
		} catch (err) {
			console.error("❌ Answer handling failed:", err);
		}
	}, []);

	const handleIceCandidate = useCallback(async (candidate) => {
		if (!candidate) return;
		const pc = peerConnectionRef.current;

		if (!pc || !pc.remoteDescription) {
			iceCandidateQueueRef.current.push(candidate);
		} else {
			try {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} catch (err) {
				console.warn("ICE candidate error:", err);
			}
		}
	}, []);

	// Close connection and cleanup
	const closeConnection = useCallback(() => {
		console.log("🔌 Closing connection");
		
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}
		
		if (remoteStreamRef.current) {
			remoteStreamRef.current.getTracks().forEach(t => t.stop());
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
		const savedSettings = localStorage.getItem('strangerChatSettings');
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

	// Main socket effect with optimized initialization
	useEffect(() => {
		if (!socket || !authUser) {
			toast.error("Connection error. Please refresh.");
			navigate("/");
			return;
		}

		let isMounted = true;
		let hasJoinedQueue = false;

		const initializeCamera = async () => {
			try {
				setStatus("initializing");
				
				// Check device support
				if (!navigator.mediaDevices?.getUserMedia) {
					throw new Error("Your browser doesn't support camera access");
				}

				// Optimized media constraints for reliable connection
				const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						width: { min: 320, ideal: isMobile ? 480 : 640, max: 1280 },
						height: { min: 240, ideal: isMobile ? 360 : 480, max: 720 },
						facingMode: "user",
						frameRate: { ideal: 24, max: 30 }
					},
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
						sampleRate: 44100
					}
				});

				if (!isMounted) {
					stream.getTracks().forEach(t => t.stop());
					return;
				}

				localStreamRef.current = stream;
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
					
					// Optimize video element for performance
					localVideoRef.current.style.willChange = 'transform';
					localVideoRef.current.style.backfaceVisibility = 'hidden';
					localVideoRef.current.style.transform = 'translateZ(0)';
					
					// Reliable video loading with proper timeout
					await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => {
							console.warn("Video load timeout, continuing anyway");
							resolve(); // Don't reject, just continue
						}, 3000);
						
						if (localVideoRef.current.readyState >= 2) {
							clearTimeout(timeout);
							resolve();
						} else {
							localVideoRef.current.onloadedmetadata = () => {
								clearTimeout(timeout);
								resolve();
							};
							localVideoRef.current.onerror = () => {
								clearTimeout(timeout);
								reject(new Error('Video load error'));
							};
						}
					});
				}

				setStatus("waiting");
				
				// Join queue immediately after camera setup with privacy settings
				if (!hasJoinedQueue && socket?.connected && isMounted) {
					socket.emit("stranger:joinQueue", {
						userId: authUser.id,
						username: privacySettings.showUsername ? authUser.username : null,
						nickname: privacySettings.showUsername ? authUser.nickname : null,
						profilePic: privacySettings.showProfilePic ? authUser.profilePic : null,
						isVerified: privacySettings.showVerificationBadge ? authUser.isVerified : false,
						allowFriendRequests: privacySettings.allowFriendRequests,
						privacySettings: privacySettings
					});
					hasJoinedQueue = true;
					toast.success("🔍 Searching for someone awesome...");
				}

			} catch (error) {
				console.error("Camera initialization failed:", error);
				
				if (error.name === 'NotAllowedError') {
					toast.error("Camera access denied. Please allow permissions and refresh.");
				} else if (error.name === 'NotFoundError') {
					toast.error("No camera found on your device.");
				} else {
					toast.error("Failed to access camera. Please refresh and try again.");
				}
				
				setTimeout(() => navigate("/"), 2000);
			}
		};

		initializeCamera();

		// Socket event handlers
		const onWaiting = () => {
			if (isMounted) setStatus("waiting");
		};

		const onMatched = (data) => {
			console.log("🎯 Matched with partner:", data);
			
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
				setReactions(prev => [...prev, reaction]);
				setTimeout(() => {
					setReactions(prev => prev.filter(r => r.id !== reaction.id));
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
				toast.success(message);
				setIsSubmittingReport(false);
				setIsReportModalOpen(false);
			}
		};

		const onReportError = ({ error }) => {
			if (isMounted) {
				toast.error(error);
				setIsSubmittingReport(false);
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
		socket.on("stranger:reportSuccess", onReportSuccess);
		socket.on("stranger:reportError", onReportError);

		return () => {
			isMounted = false;
			
			// Cleanup media
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach(t => t.stop());
				localStreamRef.current = null;
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
			socket.off("webrtc:offer", onOffer);
			socket.off("webrtc:answer", onAnswer);
			socket.off("webrtc:ice-candidate", onIce);
			socket.off("stranger:addFriendError", onAddFriendError);
			socket.off("stranger:reportSuccess", onReportSuccess);
			socket.off("stranger:reportError", onReportError);
		};
	}, [socket, authUser, navigate, addMessage, closeConnection, startCall, handleOffer, handleAnswer, handleIceCandidate, fetchFriendData]);

	// Initialize AI moderation lazily
	useEffect(() => {
		const initModeration = async () => {
			try {
				const { MODERATION_CONFIG, initNSFWModel } = await loadModerationUtils();
				if (MODERATION_CONFIG.enabled) {
					await initNSFWModel();
					setAiModerationActive(true);
				}
			} catch (error) {
				console.warn("AI moderation failed to load:", error);
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
					profilePic: privacySettings.showProfilePic ? authUser.profilePic : null,
					isVerified: privacySettings.showVerificationBadge ? authUser.isVerified : false,
					allowFriendRequests: privacySettings.allowFriendRequests,
					privacySettings: privacySettings
				});
			}
		}, 100);
		
		toast("🔄 Finding new match...", { icon: "⏭️" });
	}, [status, socket, closeConnection, addMessage, authUser]);

	const handleAddFriend = useCallback(async () => {
		if (status !== "connected" || !partnerUserId) {
			toast.error("Partner information not available");
			return;
		}

		try {
			let success = false;
			if (friendStatus === "NOT_FRIENDS") {
				success = await sendFriendRequest(partnerUserId);
				if (success) {
					toast.success("📨 Friend request sent!");
				}
			} else if (friendStatus === "REQUEST_RECEIVED") {
				success = await acceptFriendRequest(partnerUserId);
				if (success) {
					toast.success("🎉 Friend request accepted!");
				}
			}
			
			// Force refresh friend data after action
			if (success) {
				setTimeout(() => {
					fetchFriendData();
				}, 500);
			}
		} catch (error) {
			console.error("Friend request error:", error);
			toast.error("Failed to process friend request");
		}
	}, [status, partnerUserId, friendStatus, sendFriendRequest, acceptFriendRequest, fetchFriendData]);

	const handleSendMessage = useCallback((e) => {
		e.preventDefault();
		if (!currentMessage.trim() || status !== "connected") return;
		
		socket?.emit("stranger:chatMessage", { message: currentMessage });
		addMessage("You", currentMessage);
		setCurrentMessage("");
	}, [currentMessage, status, socket, addMessage]);

	// Handle chat toggle and clear unread messages
	const handleChatToggle = useCallback(() => {
		setShowChatMessages(!showChatMessages);
		if (!showChatMessages) {
			setHasUnreadMessages(false); // Clear notification when opening chat
		}
	}, [showChatMessages]);

	const captureScreenshot = useCallback(() => {
		if (!remoteVideoRef.current || remoteVideoRef.current.videoWidth === 0) {
			toast.error("Cannot capture screenshot - partner video not ready.");
			return null;
		}
		
		const canvas = document.createElement("canvas");
		canvas.width = remoteVideoRef.current.videoWidth;
		canvas.height = remoteVideoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");
		
		ctx.drawImage(remoteVideoRef.current, 0, 0);
		return canvas.toDataURL("image/jpeg", 0.9);
	}, []);

	const handleReport = useCallback(() => {
		const screenshot = captureScreenshot();
		if (screenshot) {
			setReportScreenshot(screenshot);
			setIsReportModalOpen(true);
		}
	}, [captureScreenshot]);

	const handleSubmitReport = useCallback((reason, description) => {
		if (!reportScreenshot || !reason || !partnerUserId) {
			toast.error("Missing report information");
			return;
		}
		
		setIsSubmittingReport(true);
		
		socket?.emit("stranger:report", {
			reporterId: authUser.id,
			reportedUserId: partnerUserId,
			reason,
			description: description || `Manual report: ${reason}`,
			screenshot: reportScreenshot,
			category: 'stranger_chat',
			isAIDetected: false
		});
	}, [reportScreenshot, partnerUserId, authUser, socket]);

	const sendReaction = useCallback((emoji) => {
		const reaction = {
			id: Date.now() + Math.random(),
			emoji,
			x: Math.random() * 80 + 10,
		};
		
		setReactions(prev => [...prev, reaction]);
		
		setTimeout(() => {
			setReactions(prev => prev.filter(r => r.id !== reaction.id));
		}, 3000);
		
		if (socket && status === "connected") {
			socket.emit("stranger:reaction", { emoji });
		}
	}, [socket, status]);

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

	// Get friend button config
	const getFriendButtonConfig = useMemo(() => {
		switch (friendStatus) {
			case "NOT_FRIENDS":
				return { 
					text: "Add Friend", 
					icon: UserPlus, 
					className: "btn-primary",
					disabled: false 
				};
			case "REQUEST_SENT":
				return { 
					text: "Request Sent", 
					icon: Clock, 
					className: "btn-outline btn-primary",
					disabled: true 
				};
			case "REQUEST_RECEIVED":
				return { 
					text: "Accept Request", 
					icon: UserCheck, 
					className: "btn-success",
					disabled: false 
				};
			case "FRIENDS":
				return { 
					text: "Friends", 
					icon: UserCheck, 
					className: "btn-outline btn-success",
					disabled: true 
				};
			default:
				return { 
					text: "Add Friend", 
					icon: UserPlus, 
					className: "btn-primary",
					disabled: true 
				};
		}
	}, [friendStatus]);

	return (
		<div className="fixed inset-0 flex flex-col bg-gradient-to-br from-base-300 via-base-200 to-base-300 overflow-hidden">
			{/* Loading State */}
			{status === "initializing" && <LoadingSkeleton />}
			
			{/* Main Video Container */}
			<div className="flex-1 relative overflow-hidden">
				{/* Remote Video - Full Screen with Performance Optimization */}
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
						transform: "translateZ(0)"
					}}
				/>
				
				{/* Waiting State Overlay */}
				{status === "waiting" && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/50 via-gray-900/30 to-black/50 backdrop-blur-md">
						<div className="text-center space-y-6 p-8">
							<div className="relative">
								<div className="w-24 h-24 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
								<Users className="absolute inset-0 m-auto w-8 h-8 text-yellow-400" />
							</div>
							
							<div className="space-y-2">
								<h2 className="text-3xl font-bold luxury-gradient-text animate-luxury-shimmer">
									Finding Your Match
								</h2>
								<p className="text-white/80">
									Connecting you with someone amazing...
								</p>
								{onlineCount > 0 && (
									<p className="text-sm text-white/60">
										{onlineCount} people online
									</p>
								)}
							</div>
							
							<div className="flex justify-center space-x-1">
								{[0, 1, 2].map((i) => (
									<div
										key={i}
										className={`w-2 h-2 rounded-full animate-pulse ${
											i === 1 ? 'bg-yellow-400' : 'bg-white'
										}`}
										style={{ animationDelay: `${i * 0.2}s` }}
									/>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Floating Reactions */}
				<div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
					{reactions.map((reaction) => (
						<div
							key={reaction.id}
							className="absolute bottom-0 animate-float-up text-4xl"
							style={{
								left: `${reaction.x}%`,
								textShadow: '0 2px 8px rgba(0,0,0,0.5)',
							}}
						>
							{reaction.emoji}
						</div>
					))}
				</div>

				{/* Top Status Bar */}
				<div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/50 to-transparent">
					<div className="flex items-center justify-between p-4">
						{/* Left: AI Protection & Connection */}
						<div className="flex items-center gap-3">
							{MODERATION_CONFIG.enabled && (
								<div className={`badge gap-2 ${aiModerationActive ? 'badge-success' : 'badge-warning'}`}>
									<Shield className="w-3 h-3" />
									<span className="hidden sm:inline">
										{aiModerationActive ? 'Protected' : 'Loading'}
									</span>
								</div>
							)}
							
							{status === "connected" && (
								<ConnectionIndicator quality={connectionQuality} isConnected={isConnected} />
							)}
						</div>

						{/* Center: Partner Info */}
						{status === "connected" && partnerUserData && (
							<div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
								<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50">
									{partnerUserData.profilePic ? (
										<img 
											src={partnerUserData.profilePic} 
											alt={partnerUserData.displayName || "Stranger"}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gray-500 flex items-center justify-center">
											<Users className="w-4 h-4 text-white" />
										</div>
									)}
								</div>
								<div className="flex items-center gap-2">
									<span className="font-semibold text-white text-sm">
										{partnerUserData.displayName || "Stranger"}
									</span>
									{partnerUserData.isVerified && (
										<VerifiedBadge size="sm" />
									)}
								</div>
								{chatTime > 0 && (
									<div className="flex items-center gap-1 text-white/70 text-xs">
										<Clock className="w-3 h-3" />
										{formatTime(chatTime)}
									</div>
								)}
							</div>
						)}

						{/* Right: Actions */}
						<div className="flex items-center gap-2">
							{status === "connected" && (
								<>
									<button 
										onClick={handleChatToggle}
										className="btn btn-circle btn-sm bg-black/30 border-white/20 text-white hover:bg-black/50 relative"
									>
										<MessageCircle className="w-4 h-4" />
										{hasUnreadMessages && (
											<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
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

				{/* Self Video - Picture in Picture */}
				<div className="absolute top-20 right-4 z-30">
					<div className="relative w-32 h-44 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-black/20 backdrop-blur-sm">
						<video 
							ref={localVideoRef}
							autoPlay 
							playsInline 
							muted={true}
							className="w-full h-full object-cover"
							style={{ 
								transform: 'scaleX(-1) translateZ(0)',
								willChange: "transform",
								backfaceVisibility: "hidden"
							}}
						/>
						
						{/* Video controls overlay */}
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
							<div className="flex items-center justify-between">
								<span className="text-white text-xs font-medium">You</span>
								<div className="flex gap-1">
									<button
										onClick={toggleVideo}
										className={`btn btn-circle btn-xs ${isVideoMuted ? 'btn-error' : 'btn-ghost'} text-white`}
									>
										{isVideoMuted ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}
									</button>
									<button
										onClick={toggleAudio}
										className={`btn btn-circle btn-xs ${isAudioMuted ? 'btn-error' : 'btn-ghost'} text-white`}
									>
										{isAudioMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Chat Messages */}
				<ChatMessages messages={tempMessages} isVisible={showChatMessages} />

				{/* Message Input */}
				{status === "connected" && showChatMessages && (
					<div className="absolute left-4 bottom-20 max-w-xs z-20">
						<form onSubmit={handleSendMessage} className="flex gap-2">
							<input
								type="text"
								value={currentMessage}
								onChange={(e) => setCurrentMessage(e.target.value)}
								placeholder="Type a message..."
								className="input input-sm input-bordered flex-1 bg-base-100/90 backdrop-blur-md"
								maxLength={200}
							/>
							<button
								type="submit"
								disabled={!currentMessage.trim()}
								className="btn btn-sm btn-primary"
							>
								<Send className="w-4 h-4" />
							</button>
						</form>
					</div>
				)}

				{/* Reaction Buttons */}
				{status === "connected" && (
					<div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
						<div className="flex gap-2 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
							{['❤️', '👍', '😂', '🎉', '😊', '🔥'].map((emoji) => (
								<button
									key={emoji}
									onClick={() => sendReaction(emoji)}
									className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-90 transition-all duration-200"
								>
									<span className="text-2xl">{emoji}</span>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Bottom Control Bar */}
				<div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/70 to-transparent">
					<div className="flex items-center justify-center gap-4 p-4 pb-6">
						{/* Skip Button */}
						<button
							onClick={handleSkip}
							disabled={status === "initializing"}
							className="btn btn-lg gap-3 bg-gradient-to-r from-primary to-primary/80 border-none text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
						>
							<SkipForward className="w-5 h-5" />
							<span className="font-semibold">
								{status === "connected" ? "Skip" : status === "waiting" ? "Searching..." : "Start"}
							</span>
						</button>

						{/* Add Friend Button - Only show if both users allow friend requests */}
						{status === "connected" && partnerUserId && privacySettings.allowFriendRequests && partnerUserData?.allowFriendRequests && (
							<button
								onClick={handleAddFriend}
								disabled={getFriendButtonConfig.disabled}
								className={`btn btn-lg gap-3 ${getFriendButtonConfig.className} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
							>
								<getFriendButtonConfig.icon className="w-5 h-5" />
								<span className="font-semibold hidden sm:inline">
									{getFriendButtonConfig.text}
								</span>
							</button>
						)}

						{/* Leave Button */}
						<button
							onClick={() => navigate("/")}
							className="btn btn-lg btn-outline btn-error gap-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
						>
							<PhoneOff className="w-5 h-5" />
							<span className="font-semibold">Leave</span>
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
			<style jsx>{`
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
			`}</style>
		</div>
	);
};

export default StrangerChatPage;