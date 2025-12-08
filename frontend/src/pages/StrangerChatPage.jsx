import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import toast from "react-hot-toast";
import {
	PhoneOff,
	Send,
	UserPlus,
	SkipForward,
	Loader2,
	MessageSquare,
	AlertTriangle,
	Wifi,
	WifiOff,
	Video,
	VideoOff,
	Mic,
	MicOff,
	Users,
	Clock,
	Shield,
	SwitchCamera,
	Smile,
	Heart,
	ThumbsUp,
	Laugh,
	PartyPopper,
	Repeat,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/VerifiedBadge";
import { analyzeFrame, captureVideoFrame, MODERATION_CONFIG, initNSFWModel } from "../utils/contentModeration";

const REPORT_REASONS = [
	"Nudity or Sexual Content",
	"Harassment or Hate Speech",
	"Spam or Scams",
	"Threatening Behavior",
	"Underage User",
	"Other",
];

// --- Report Modal Component (unchanged) ---
const ReportModal = ({ isOpen, onClose, onSubmit, screenshotPreview, isSubmitting }) => {
	const [reason, setReason] = useState("");
	useEffect(() => { if (isOpen) setReason(""); }, [isOpen]);
	if (!isOpen) return null;
	
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!reason) { toast.error("Please select a reason."); return; }
		onSubmit(reason);
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-md">
				<h2 className="text-xl font-bold mb-4">Report User</h2>
				<p className="text-sm mb-4 text-base-content/80">A screenshot will be sent for review.</p>
				{screenshotPreview && (
					<div className="mb-4 border border-base-300 rounded overflow-hidden">
						<img src={screenshotPreview} alt="Report Screenshot" className="max-h-40 w-full object-contain bg-black" loading="lazy" decoding="async" />
					</div>
				)}
				<form onSubmit={handleSubmit}>
					<div className="form-control mb-4">
						<label className="label"><span className="label-text">Reason:</span></label>
						<select className="select select-bordered w-full" value={reason} onChange={(e) => setReason(e.target.value)} required>
							<option value="" disabled>Select a reason</option>
							{REPORT_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
						</select>
					</div>
					<div className="flex justify-end gap-3 mt-6">
						<button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
						<button type="submit" className="btn btn-error" disabled={isSubmitting || !reason}>
							{isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Report"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// --- Stranger Chat Page Component ---
const StrangerChatPage = () => {
	const { authUser, socket } = useAuthStore();
	// ✅ FIX: Get the full friend store and fetch function
	const { getFriendshipStatus, fetchFriendData } = useFriendStore(); 
	const navigate = useNavigate();

	const [status, setStatus] = useState("idle");
	const [tempMessages, setTempMessages] = useState([]);
	const [currentMessage, setCurrentMessage] = useState("");
	// ✅ FIX: Use null to track the partner's permanent ID
	const [partnerUserId, setPartnerUserId] = useState(null);
	const [partnerUserData, setPartnerUserData] = useState(null); // Store full partner data
	const [friendStatus, setFriendStatus] = useState("NOT_FRIENDS");
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [reportScreenshot, setReportScreenshot] = useState(null);
	const [isSubmittingReport, setIsSubmittingReport] = useState(false);
	const [aiModerationActive, setAiModerationActive] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	
	// New state for enhanced features
	const [connectionQuality, setConnectionQuality] = useState("good");
	const [isVideoMuted, setIsVideoMuted] = useState(false);
	const [isAudioMuted, setIsAudioMuted] = useState(false);
	const [chatTime, setChatTime] = useState(0);
	const [onlineCount, setOnlineCount] = useState(0);
	const [showPartnerInfo, setShowPartnerInfo] = useState(false);
	
	// Video swap feature
	const [isVideoSwapped, setIsVideoSwapped] = useState(false);
	
	// Camera flip feature
	const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
	
	// Reactions feature
	const [reactions, setReactions] = useState([]);
	
	const chatTimerRef = useRef(null);

	const peerConnectionRef = useRef(null);
	const localStreamRef = useRef(null);
	const remoteStreamRef = useRef(null);
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const iceCandidateQueueRef = useRef([]);

	const addMessage = useCallback((sender, message) => {
		setTempMessages((prev) => [...prev, { sender, message }]);
		// Increment unread count if chat is closed and message is from stranger
		if (!isChatOpen && sender === "Stranger") {
			setUnreadCount(prev => prev + 1);
		}
	}, [isChatOpen]);

	// --- WebRTC helper functions (unchanged from yours) ---
	const createPeerConnection = useCallback(() => {
		console.log("WebRTC: Creating PeerConnection");
		const pc = new RTCPeerConnection({
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" },
				{ urls: "stun:stun2.l.google.com:19302" },
				{ urls: "stun:stun3.l.google.com:19302" },
				{ urls: "stun:stun4.l.google.com:19302" }
			],
			iceCandidatePoolSize: 10,
			// ✅ OPTIMIZED: Better connection settings
			bundlePolicy: 'max-bundle',
			rtcpMuxPolicy: 'require',
			iceTransportPolicy: 'all'
		});

		pc.onicecandidate = (e) => {
			if (e.candidate && socket) {
				console.log("WebRTC: Sending ICE candidate");
				socket.emit("webrtc:ice-candidate", { candidate: e.candidate });
			}
		};

		pc.ontrack = (e) => {
			if (e.streams && e.streams[0]) {
				console.log("WebRTC: Received remote track");
				remoteStreamRef.current = e.streams[0];
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = e.streams[0];
				}
			}
		};

		pc.onconnectionstatechange = () => {
			console.log("WebRTC: Connection state:", pc.connectionState);
			if (pc.connectionState === 'failed') {
				console.error("WebRTC: Connection failed");
				setConnectionQuality("poor");
				toast.error("Video connection failed. Click Skip to try another partner.");
				addMessage("System", "Video connection failed. Try skipping.");
			} else if (pc.connectionState === 'connected') {
				console.log("✅ WebRTC: Connected successfully!");
				setConnectionQuality("good");
				toast.success("Video connected!");
				addMessage("System", "Video connected! Say hi!");
				// Start chat timer
				setChatTime(0);
				chatTimerRef.current = setInterval(() => {
					setChatTime(prev => prev + 1);
				}, 1000);
			} else if (pc.connectionState === 'connecting') {
				console.log("🔄 WebRTC: Connecting...");
				setConnectionQuality("fair");
			}
		};

		pc.oniceconnectionstatechange = () => {
			console.log("WebRTC: ICE connection state:", pc.iceConnectionState);
			if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
				console.error("WebRTC: ICE connection issue");
			}
		};

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				const sender = pc.addTrack(track, localStreamRef.current);
				
				// ✅ OPTIMIZED: Set high quality parameters for video
				if (track.kind === 'video') {
					const parameters = sender.getParameters();
					if (!parameters.encodings) {
						parameters.encodings = [{}];
					}
					// Adaptive bitrate: 500kbps to 8Mbps (4K support)
					parameters.encodings[0].maxBitrate = 8000000; // 8 Mbps for 4K
					parameters.encodings[0].minBitrate = 500000;  // 500 Kbps minimum
					parameters.encodings[0].maxFramerate = 60;
					parameters.encodings[0].scaleResolutionDownBy = 1; // No downscaling
					sender.setParameters(parameters).catch(e => console.log('Set parameters error:', e));
				}
			});
		}

		peerConnectionRef.current = pc;
		iceCandidateQueueRef.current = [];
		return pc;
	}, [socket]);

	const startCall = useCallback(async () => {
		console.log("WebRTC: Starting call as initiator");
		if (!localStreamRef.current) {
			console.error("No local stream!");
			return;
		}

		try {
			const pc = createPeerConnection();
			
			// ✅ OPTIMIZED: High quality offer constraints
			const offer = await pc.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
				voiceActivityDetection: true,
				iceRestart: false
			});
			
			await pc.setLocalDescription(offer);
			console.log("WebRTC: Sending offer");
			socket.emit("webrtc:offer", { sdp: offer });
		} catch (err) {
			console.error("Error creating offer:", err);
		}
	}, [createPeerConnection, socket]);

	const handleOffer = useCallback(async (sdp) => {
		console.log("WebRTC: Received offer, creating answer");
		
		// ✅ FIX: Wait for local stream with longer timeout
		if (!localStreamRef.current) {
			console.log("⏳ Waiting for local stream...");
			let attempts = 0;
			while (!localStreamRef.current && attempts < 20) {
				await new Promise(resolve => setTimeout(resolve, 500));
				attempts++;
			}
			
			if (!localStreamRef.current) {
				console.error("❌ No local stream after waiting!");
				toast.error("Camera not ready. Please refresh and try again.");
				return;
			}
		}
		
		// ✅ FIX: Verify stream is active
		if (!localStreamRef.current.active) {
			console.error("❌ Local stream is not active!");
			toast.error("Camera stopped. Please refresh.");
			return;
		}

		try {
			const pc = createPeerConnection();
			await pc.setRemoteDescription(new RTCSessionDescription(sdp));
			
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			
			console.log("✅ WebRTC: Sending answer");
			socket.emit("webrtc:answer", { sdp: answer });

			// ✅ FIX: Process queued ICE candidates after setting remote description
			console.log(`📦 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
			iceCandidateQueueRef.current.forEach(candidate => {
				pc.addIceCandidate(new RTCIceCandidate(candidate))
					.then(() => console.log("✅ Added queued ICE candidate"))
					.catch(e => console.error("❌ ICE error:", e));
			});
			iceCandidateQueueRef.current = [];
		} catch (err) {
			console.error("❌ Error handling offer:", err);
			toast.error("Connection failed. Click Skip to try again.");
		}
	}, [createPeerConnection, socket]);

	const handleAnswer = useCallback(async (sdp) => {
		// ... (handleAnswer logic) ...
		console.log("WebRTC: Received answer");
		const pc = peerConnectionRef.current;
		if (!pc) return;

		try {
			await pc.setRemoteDescription(new RTCSessionDescription(sdp));
			iceCandidateQueueRef.current.forEach(candidate => {
				pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE error:", e));
			});
			iceCandidateQueueRef.current = [];
		} catch (err) {
			console.error("Error handling answer:", err);
		}
	}, []);

	const handleIceCandidate = useCallback(async (candidate) => {
		// ... (handleIceCandidate logic) ...
		if (!candidate) return;
		const pc = peerConnectionRef.current;

		if (!pc || !pc.remoteDescription) {
			iceCandidateQueueRef.current.push(candidate);
		} else {
			try {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} catch (err) {
				console.error("Error adding ICE candidate:", err);
			}
		}
	}, []);

	const closeConnection = useCallback(() => {
		console.log("WebRTC: Closing connection");
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
		setTempMessages([]);
		// ✅ FIX: Reset partner ID and status
		setPartnerUserId(null);
		setPartnerUserData(null); // Reset partner data
		setFriendStatus("NOT_FRIENDS");
		setConnectionQuality("good");
		setShowPartnerInfo(false);
		iceCandidateQueueRef.current = [];
		
		// Clear chat timer
		if (chatTimerRef.current) {
			clearInterval(chatTimerRef.current);
			chatTimerRef.current = null;
		}
		setChatTime(0);
	}, []);

	// --- Primary Logic Effect ---
	
	// ✅ FIX: New effect to update friend status when partnerUserId changes
	useEffect(() => {
		if (partnerUserId) {
			const status = getFriendshipStatus(partnerUserId);
			setFriendStatus(status);
			// Also re-fetch friend data to ensure the status check is accurate 
			// (handles acceptance/rejection from other places)
			fetchFriendData(); 
		} else {
			setFriendStatus("NOT_FRIENDS");
		}
	}, [partnerUserId, getFriendshipStatus, fetchFriendData]);


	// --- Main Socket Effect ---
	useEffect(() => {
		if (!socket) {
			console.error("❌ Socket not available!");
			toast.error("Connection error. Please refresh the page.");
			setTimeout(() => navigate("/"), 2000);
			return;
		}

		if (!authUser) {
			toast.error("Authentication error.");
			navigate("/");
			return;
		}

		// If socket is not connected yet, wait for it
		if (!socket.connected) {
			console.log("⏳ Socket not connected yet, waiting...");
			const connectTimeout = setTimeout(() => {
				if (!socket.connected) {
					console.error("❌ Socket connection timeout");
					toast.error("Connection failed. Please refresh the page.");
					navigate("/");
				}
			}, 10000); // Increased to 10 seconds
			
			const onConnect = () => {
				clearTimeout(connectTimeout);
				console.log("✅ Socket connected successfully");
				toast.success("Connected! Finding a partner...");
			};
			
			socket.once('connect', onConnect);
			
			return () => {
				clearTimeout(connectTimeout);
				socket.off('connect', onConnect);
			};
		}

		let isMounted = true;
		let hasJoinedQueue = false;

		// Request camera and microphone permissions
		const requestPermissions = async () => {
			try {
				console.log("Requesting camera and microphone permissions...");
				
				// Check if mediaDevices is supported
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					throw new Error("Your browser doesn't support camera/microphone access");
				}
				
				// ✅ OPTIMIZED: Adaptive quality - 4K support with fallback
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: { 
						width: { min: 640, ideal: 1920, max: 3840 }, // Up to 4K
						height: { min: 480, ideal: 1080, max: 2160 },
						facingMode: "user",
						frameRate: { ideal: 30, max: 60 }, // Smooth video
						aspectRatio: { ideal: 16/9 }
					}, 
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
						sampleRate: 48000, // High quality audio
						channelCount: 2 // Stereo
					}
				});
				
				if (!isMounted) {
					stream.getTracks().forEach(t => t.stop());
					return;
				}
				
				console.log("✅ Permissions granted, stream obtained");
				localStreamRef.current = stream;
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
					
					// ✅ FIX: Wait for video to be FULLY ready with timeout
					await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
						
						if (localVideoRef.current.readyState >= 2) {
							clearTimeout(timeout);
							resolve();
						} else {
							localVideoRef.current.onloadedmetadata = () => {
								clearTimeout(timeout);
								resolve();
							};
						}
					});
					
					console.log("✅ Local video fully loaded and ready");
				}
				
				setStatus("waiting");
				
				// ✅ OPTIMIZED: Reduced delay for faster connection (1000ms → 300ms)
				await new Promise(resolve => setTimeout(resolve, 300));
				
				if (!hasJoinedQueue && socket && socket.connected) {
					console.log("✅ Joining stranger queue...");
					socket.emit("stranger:joinQueue", { 
						userId: authUser.id,
						username: authUser.username,
						nickname: authUser.nickname,
						profilePic: authUser.profilePic,
						isVerified: authUser.isVerified
					});
					hasJoinedQueue = true;
					console.log("✅ Queue join request sent");
				} else {
					console.error("❌ Cannot join queue - socket not connected");
					toast.error("Connection error. Please refresh the page.");
				}
			} catch (error) {
				console.error("Permission error:", error);
				if (error.name === 'NotAllowedError') {
					toast.error("Camera and microphone access denied. Please allow permissions and refresh.");
				} else if (error.name === 'NotFoundError') {
					toast.error("No camera or microphone found on your device.");
				} else if (error.name === 'NotReadableError') {
					toast.error("Camera or microphone is already in use by another application.");
				} else {
					toast.error(error.message || "Failed to access camera/microphone");
				}
				setTimeout(() => navigate("/"), 2000);
			}
		};
		
		requestPermissions();


		const onWaiting = () => {
			if (isMounted) setStatus("waiting");
		};

		const onMatched = (data) => {
			// ✅ FIX: Store the partner's permanent user ID and full data
			console.log("✅ Socket: matched with", data.partnerId, "User ID:", data.partnerUserId); 
			console.log("📊 Match data:", data);
			
			if (isMounted) {
				addMessage("System", "Partner found! Connecting video...");
				setStatus("connected");
				setPartnerUserId(data.partnerUserId); // ✅ Store the permanent ID
				setPartnerUserData(data.partnerUserData); // ✅ Store full user data (username, nickname, isVerified)
				setShowPartnerInfo(true); // Show partner info
				
				// ✅ FIX: Ensure local stream is ready before initiating
				const shouldInitiate = socket.id < data.partnerId;
				console.log(`🎯 My socket ID: ${socket.id}`);
				console.log(`🎯 Partner socket ID: ${data.partnerId}`);
				console.log(`🎯 Should I initiate WebRTC? ${shouldInitiate}`);
				
				if (shouldInitiate) {
					console.log("🎥 I will initiate WebRTC call in 500ms...");
					setTimeout(() => {
						if (isMounted && localStreamRef.current && localStreamRef.current.active) {
							console.log("🎥 Starting WebRTC call now...");
							startCall();
						} else {
							console.error("❌ Cannot start call - stream not ready");
							toast.error("Video not ready. Please refresh.");
						}
					}, 500); // ✅ OPTIMIZED: Reduced for faster connection (2000ms → 500ms)
				} else {
					console.log("⏳ Waiting for partner to initiate WebRTC...");
					addMessage("System", "Waiting for partner's video...");
				}
			}
		};

		const onDisconnected = () => {
			if (isMounted) {
				addMessage("System", "Partner disconnected.");
				toast.info("Partner left. Finding a new match...");
				closeConnection(); 
				setStatus("waiting");
				socket.emit("stranger:joinQueue", { userId: authUser.id });
			}
		};
		
		const onQueueStats = (data) => {
			if (isMounted && data.onlineCount !== undefined) {
				setOnlineCount(data.onlineCount);
			}
		};

		const onChatMessage = (payload) => {
			if (isMounted) addMessage("Stranger", payload.message);
		};

		const onFriendRequest = () => {
			if (isMounted) {
				toast.success("Stranger sent you a friend request!");
				// ✅ FIX: Force a re-fetch and rely on the status check effect
				fetchFriendData(); 
			}
		};

		const onFriendRequestSent = () => {
			if (isMounted) {
				toast.success("Friend request sent!");
				// ✅ FIX: Force a re-fetch and rely on the status check effect
				fetchFriendData(); 
			}
		};

		// ... (WebRTC handlers onOffer, onAnswer, onIce, etc.) ...
		const onOffer = (payload) => {
			console.log("Socket: received offer");
			if (isMounted) handleOffer(payload.sdp);
		};

		const onAnswer = (payload) => {
			console.log("Socket: received answer");
			if (isMounted) handleAnswer(payload.sdp);
		};

		const onIce = (payload) => {
			if (isMounted) handleIceCandidate(payload.candidate);
		};
		// ... (End WebRTC handlers) ...


		// --- Error and Report Listeners ---
        const onAddFriendError = ({ error }) => {
            if (isMounted) {
                toast.error(error);
                // ✅ FIX: Force a status check to reset button if necessary
                setFriendStatus(getFriendshipStatus(partnerUserId)); 
            }
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


		socket.on("stranger:waiting", onWaiting);
		socket.on("stranger:matched", onMatched);
		socket.on("stranger:disconnected", onDisconnected);
		socket.on("stranger:chatMessage", onChatMessage);
		socket.on("stranger:friendRequest", onFriendRequest);
		socket.on("stranger:friendRequestSent", onFriendRequestSent);
		
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
		socket.on("stranger:reaction", onReaction);
		
		socket.on("webrtc:offer", onOffer);
		socket.on("webrtc:answer", onAnswer);
		socket.on("webrtc:ice-candidate", onIce);

        socket.on("stranger:addFriendError", onAddFriendError);
        socket.on("stranger:reportSuccess", onReportSuccess);
        socket.on("stranger:reportError", onReportError);

		return () => {
			isMounted = false;
			setStatus("idle");
			
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach(t => t.stop());
				localStreamRef.current = null;
			}
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = null;
			}
			
			closeConnection();
			
			if (socket && socket.connected) {
				socket.emit("stranger:skip");
			}
			
			// --- Cleanup all listeners ---
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
	// Added fetchFriendData as a dependency
	}, [socket, authUser, navigate, addMessage, closeConnection, startCall, handleOffer, handleAnswer, handleIceCandidate, fetchFriendData]); 

	// --- Initialize AI Model on Mount ---
	useEffect(() => {
		if (MODERATION_CONFIG.enabled) {
			console.log('🚀 Initializing AI moderation model...');
			setAiModerationActive(false);
			initNSFWModel().then(() => {
				console.log('✅ AI moderation ready');
				setAiModerationActive(true);
			}).catch(err => {
				console.error('❌ Failed to initialize AI moderation:', err);
				setAiModerationActive(false);
			});
		}
	}, []);

	// --- AI Content Moderation Effect ---
	useEffect(() => {
		if (!MODERATION_CONFIG.enabled || status !== 'connected' || !remoteVideoRef.current || !partnerUserId) {
			return;
		}

		let violations = 0;
		let moderationInterval;
		let checkCount = 0;

		const checkContent = async () => {
			try {
				checkCount++;
				console.log(`🔍 AI Check #${checkCount} - Status: ${status}`);
				
				if (!remoteVideoRef.current || remoteVideoRef.current.readyState < 2) {
					console.log('⏳ Video not ready yet, skipping check');
					return;
				}

				const analysis = await analyzeFrame(remoteVideoRef.current);
				
				// Skip if model is still loading or video not ready
				if (analysis.loading || analysis.videoNotReady) {
					console.log('⏳ Skipping check - model loading or video not ready');
					return;
				}
				
				if (analysis.error) {
					console.error('❌ Analysis error:', analysis.error);
					return;
				}
				
				// Check for ANY suspicious content (even low confidence)
				const confidence = analysis.highestRisk?.probability || 0;
				const category = analysis.highestRisk?.className || 'Unknown';
				
				// Check if it's potentially inappropriate (Porn, Hentai, or Sexy)
				const isSuspicious = ['Porn', 'Hentai', 'Sexy'].includes(category);
				
				// Silent report to admin for low confidence (10%+) - no user action
				if (isSuspicious && confidence >= MODERATION_CONFIG.silentReportThreshold && confidence < MODERATION_CONFIG.confidenceThreshold) {
					console.log(`📋 SILENT REPORT to admin - Low confidence: ${(confidence * 100).toFixed(1)}%`);
					const screenshot = captureVideoFrame(remoteVideoRef.current);
					if (screenshot && socket) {
						socket.emit('stranger:aiSuspicion', {
							reporterId: authUser.id,
							reportedUserId: partnerUserId,
							reason: 'AI Suspicion - Low Confidence',
							description: `AI detected suspicious content: ${category} (${(confidence * 100).toFixed(1)}% confidence)\n\nThis is a low-confidence detection for admin review only. No action taken against user.`,
							screenshot,
							category: 'stranger_chat',
							isAIDetected: true,
							aiConfidence: confidence,
							aiCategory: category,
							isSilentReport: true
						});
					}
				}
				
				// User-facing actions for higher confidence
				if (!analysis.safe) {
					violations++;
					
					console.warn('⚠️ AI Moderation Alert:', {
						violations,
						confidence: `${(confidence * 100).toFixed(1)}%`,
						category: category,
						allPredictions: analysis.predictions
					});

					if (confidence >= MODERATION_CONFIG.autoReportThreshold) {
						// High confidence (80%+) - auto-report and disconnect
						console.log('🚨 AUTO-REPORTING due to high confidence');
						const screenshot = captureVideoFrame(remoteVideoRef.current);
						if (screenshot && socket) {
							socket.emit('stranger:report', {
								reporterId: authUser.id,
								reportedUserId: partnerUserId,
								reason: 'Nudity or Sexual Content',
								description: `AI detected: ${category} (${(confidence * 100).toFixed(1)}% confidence)`,
								screenshot,
								category: 'stranger_chat',
								isAIDetected: true,
								aiConfidence: confidence,
								aiCategory: category
							});
						}
						
						toast.error('Inappropriate content detected. Disconnecting and reporting.');
						handleSkip();
					} else if (violations >= MODERATION_CONFIG.maxViolations) {
						// Multiple violations (60%+) - disconnect
						console.log('🚨 DISCONNECTING due to multiple violations');
						toast.error('Multiple content violations detected. Disconnecting.');
						handleSkip();
					} else {
						// Warning (60-79%)
						toast.warning(`Warning: Potentially inappropriate content detected (${violations}/${MODERATION_CONFIG.maxViolations})`);
					}
				} else {
					console.log('✅ Content check passed - safe');
				}
			} catch (error) {
				console.error('❌ AI Moderation error:', error);
			}
		};

		// Start checking after a short delay to let video stabilize
		console.log('⏰ Starting AI moderation checks in 3 seconds...');
		const startTimeout = setTimeout(() => {
			console.log(`✅ AI moderation active - checking every ${MODERATION_CONFIG.checkInterval/1000}s`);
			checkContent(); // Run first check immediately
			moderationInterval = setInterval(checkContent, MODERATION_CONFIG.checkInterval);
		}, 3000);

		return () => {
			console.log('🛑 Stopping AI moderation checks');
			clearTimeout(startTimeout);
			if (moderationInterval) {
				clearInterval(moderationInterval);
			}
		};
	}, [status, partnerUserId, authUser, socket]);

	const handleSkip = () => {
		if (status === "idle") return;
		if (status === "connected") addMessage("System", "Skipping...");
		socket.emit("stranger:skip");
		closeConnection();
		setStatus("waiting");
	};

	const handleSendTempMessage = (e) => {
		e.preventDefault();
		if (!currentMessage.trim() || status !== "connected") return;
		socket.emit("stranger:chatMessage", { message: currentMessage });
		addMessage("You", currentMessage);
		setCurrentMessage("");
	};

	const handleAddFriend = () => {
		// ✅ FIX: Validate we have the partner's user ID
		if (status !== "connected" || !partnerUserId) {
			console.error("❌ Cannot add friend - no partner user ID");
			toast.error("Partner information not available");
			return;
		}
		
		console.log(`👥 Sending friend request to user ID: ${partnerUserId}`);
		
		// ✅ FIX: Send the actual user ID, not socket ID
		socket.emit("stranger:addFriend", { 
			partnerUserId: partnerUserId // This is the MongoDB user ID
		});
	};

	const captureScreenshot = () => {
		// ... (captureScreenshot logic) ...
		if (!remoteVideoRef.current || remoteVideoRef.current.videoWidth === 0) {
			toast.error("Cannot capture screenshot.");
			return null;
		}
		const canvas = document.createElement("canvas");
		canvas.width = remoteVideoRef.current.videoWidth;
		canvas.height = remoteVideoRef.current.videoHeight;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(remoteVideoRef.current, 0, 0);
		return canvas.toDataURL("image/jpeg");
	};

	const handleReport = () => {
		// ... (handleReport logic) ...
		const screenshot = captureScreenshot();
		if (screenshot) {
			setReportScreenshot(screenshot);
			setIsReportModalOpen(true);
		}
	};

	const handleSubmitReport = (reason) => {
		// ... (handleSubmitReport logic) ...
		if (!reportScreenshot || !reason || !partnerUserId) return;
		setIsSubmittingReport(true);
		socket.emit("stranger:report", {
			reporterId: authUser.id,
			reportedUserId: partnerUserId,
			reason,
			description: "Reported from stranger chat",
			screenshot: reportScreenshot,
			category: 'stranger_chat'
		});
	};

	// Toggle chat and reset unread count
	const toggleChat = () => {
		setIsChatOpen(!isChatOpen);
		if (!isChatOpen) {
			setUnreadCount(0);
		}
	};

	// Video swap - switch between main and PiP
	const handleVideoSwap = () => {
		setIsVideoSwapped(!isVideoSwapped);
	};

	// Camera flip - switch between front and back camera
	const handleCameraFlip = async () => {
		try {
			const newFacingMode = facingMode === "user" ? "environment" : "user";
			
			// Stop current stream
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach(track => track.stop());
			}
			
			// Get new stream with flipped camera
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { min: 640, ideal: 1920, max: 3840 },
					height: { min: 480, ideal: 1080, max: 2160 },
					facingMode: newFacingMode,
					frameRate: { ideal: 30, max: 60 },
					aspectRatio: { ideal: 16/9 }
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 48000,
					channelCount: 2
				}
			});
			
			localStreamRef.current = stream;
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}
			
			// Update peer connection with new stream
			if (peerConnectionRef.current) {
				const videoTrack = stream.getVideoTracks()[0];
				const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
				if (sender) {
					sender.replaceTrack(videoTrack);
				}
			}
			
			setFacingMode(newFacingMode);
			toast.success(`Switched to ${newFacingMode === "user" ? "front" : "back"} camera`);
		} catch (error) {
			console.error("Camera flip error:", error);
			toast.error("Failed to switch camera");
		}
	};

	// Send reaction
	const sendReaction = (emoji) => {
		const reaction = {
			id: Date.now() + Math.random(),
			emoji,
			x: Math.random() * 80 + 10, // Random position 10-90%
		};
		
		setReactions(prev => [...prev, reaction]);
		
		// Remove reaction after animation
		setTimeout(() => {
			setReactions(prev => prev.filter(r => r.id !== reaction.id));
		}, 3000);
		
		// Send to partner via socket
		if (socket && status === "connected") {
			socket.emit("stranger:reaction", { emoji });
		}
	};

	return (
		<div className="fixed inset-0 flex flex-col bg-base-300 overflow-hidden">
			{/* Main Video Container - Full Screen */}
			<div className="flex-1 relative overflow-hidden">
				{/* Remote Video - Full Screen Background */}
				<video 
					ref={isVideoSwapped ? localVideoRef : remoteVideoRef}
					autoPlay 
					playsInline 
					muted={isVideoSwapped}
					className="absolute inset-0 w-full h-full object-cover bg-base-300"
					style={{
						transform: isVideoSwapped ? 'scaleX(-1)' : 'none',
						willChange: 'transform',
						backfaceVisibility: 'hidden',
						WebkitBackfaceVisibility: 'hidden'
					}}
				/>
				
				{/* Floating Reactions Animation */}
				<div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
					{reactions.map((reaction) => (
						<div
							key={reaction.id}
							className="absolute bottom-0 animate-float-up"
							style={{
								left: `${reaction.x}%`,
								fontSize: '3rem',
								textShadow: '0 2px 8px rgba(0,0,0,0.3)',
							}}
						>
							{reaction.emoji}
						</div>
					))}
				</div>
				
				{/* Waiting State Overlay */}
				{status === "waiting" && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100">
						<Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-spin mb-4 sm:mb-6" />
						<p className="text-2xl sm:text-3xl font-bold text-base-content mb-2 px-4 text-center">
							Finding your match...
						</p>
						<p className="text-sm sm:text-base text-base-content/60 px-4 text-center">Get ready to meet someone new!</p>
					</div>
				)}

				{/* Top Bar */}
				<div className="absolute top-0 left-0 right-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-300">
					<div className="flex items-center justify-between px-4 py-3">
						{/* AI Protection Badge - Outline Only */}
						{MODERATION_CONFIG.enabled && status === "connected" && (
							<div className={`badge badge-outline gap-2 border-2 ${aiModerationActive ? 'border-success text-success' : 'border-warning text-warning'}`}>
								<span className={`w-2 h-2 rounded-full ${aiModerationActive ? 'bg-success animate-pulse' : 'bg-warning'}`}></span>
								{aiModerationActive ? 'AI Protected' : 'AI Loading'}
							</div>
						)}
						
						<div className="flex-1"></div>
						
						{/* Report Button - Outline Only */}
						{status === "connected" && (
							<button 
								onClick={handleReport}
								className="btn btn-outline btn-error btn-sm gap-2 border-2"
							>
								<AlertTriangle size={16} />
								<span className="hidden sm:inline">Report</span>
							</button>
						)}
					</div>
				</div>

				{/* Self Camera - Picture-in-Picture - Clickable to Swap */}
				<div 
					className="absolute top-20 right-4 z-20 cursor-pointer group" 
					onClick={handleVideoSwap}
					title="Click to swap views"
				>
					<div className="relative w-32 h-44 sm:w-36 sm:h-48 md:w-40 md:h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-primary bg-base-300 transition-transform hover:scale-105">
						<video 
							ref={isVideoSwapped ? remoteVideoRef : localVideoRef}
							autoPlay 
							playsInline 
							muted={!isVideoSwapped}
							className="w-full h-full object-cover"
							style={{
								transform: !isVideoSwapped ? 'scaleX(-1)' : 'none',
								willChange: 'transform',
								backfaceVisibility: 'hidden',
								WebkitBackfaceVisibility: 'hidden'
							}}
						/>
						{/* Swap Icon Overlay */}
						<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<Repeat className="w-10 h-10 text-white drop-shadow-lg" />
						</div>
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
							<p className="text-white text-xs font-bold">{isVideoSwapped ? "Stranger" : "You"}</p>
						</div>
					</div>
				</div>
				
				{/* Camera Flip Button - Outline Style */}
				{status === "connected" && (
					<div className="absolute top-20 left-4 z-20">
						<button
							onClick={handleCameraFlip}
							className="btn btn-circle btn-outline btn-primary btn-sm sm:btn-md shadow-lg hover:scale-110 transition-transform bg-base-100/80 backdrop-blur-md"
							title="Flip Camera"
						>
							<SwitchCamera size={20} />
						</button>
					</div>
				)}
				
				{/* Reaction Buttons - Bottom Horizontal (Instagram/Snapchat Style) */}
				{status === "connected" && (
					<div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 
					            flex flex-row gap-2 sm:gap-3 
					            bg-base-100/90 backdrop-blur-lg rounded-full 
					            px-3 sm:px-4 py-2 sm:py-2.5 
					            shadow-2xl border border-base-300/50
					            animate-slide-up">
						<button 
							onClick={() => sendReaction("❤️")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Send Love"
						>
							<span className="text-2xl sm:text-3xl">❤️</span>
						</button>
						<button 
							onClick={() => sendReaction("👍")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Thumbs Up"
						>
							<span className="text-2xl sm:text-3xl">👍</span>
						</button>
						<button 
							onClick={() => sendReaction("😂")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Laugh"
						>
							<span className="text-2xl sm:text-3xl">😂</span>
						</button>
						<button 
							onClick={() => sendReaction("🎉")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Party"
						>
							<span className="text-2xl sm:text-3xl">🎉</span>
						</button>
						<button 
							onClick={() => sendReaction("😊")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Smile"
						>
							<span className="text-2xl sm:text-3xl">😊</span>
						</button>
						<button 
							onClick={() => sendReaction("🔥")} 
							className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
							         rounded-full hover:bg-base-200 active:scale-90 
							         transition-all duration-200 hover:scale-110"
							title="Fire"
						>
							<span className="text-2xl sm:text-3xl">🔥</span>
						</button>
					</div>
				)}

				{/* Bottom Control Bar - Fixed at Bottom */}
				<div className="absolute bottom-0 left-0 right-0 z-30 bg-base-100/95 backdrop-blur-md border-t border-base-300 safe-area-bottom">
					<div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-center gap-2 sm:gap-3">
						{/* Skip/Start Button */}
						<button
							onClick={handleSkip}
							disabled={status === "idle"}
							className="btn btn-outline btn-primary btn-sm gap-1.5 min-h-[2.5rem] h-10"
						>
							<SkipForward size={16} />
							<span className="text-sm">{status === "connected" ? "Next" : "Start"}</span>
						</button>

						{/* Add Friend Button */}
						<button
							onClick={handleAddFriend}
							disabled={status !== "connected" || friendStatus === "REQUEST_SENT" || friendStatus === "FRIENDS"}
							className="btn btn-outline btn-secondary btn-sm gap-1.5 min-h-[2.5rem] h-10"
						>
							<UserPlus size={16} />
							<span className="text-sm hidden sm:inline">
								{friendStatus === "NOT_FRIENDS" && "Add"}
								{friendStatus === "REQUEST_SENT" && "Sent"}
								{friendStatus === "REQUEST_RECEIVED" && "Accept"}
								{friendStatus === "FRIENDS" && "Friends"}
							</span>
							<span className="text-sm sm:hidden">+</span>
						</button>

						{/* Leave Button */}
						<button
							onClick={() => navigate("/")}
							className="btn btn-outline btn-error btn-sm gap-1.5 min-h-[2.5rem] h-10"
						>
							<PhoneOff size={16} />
							<span className="text-sm">Leave</span>
						</button>
					</div>
				</div>

				{/* Floating Chat Button - Left Bottom Corner */}
				<div className="absolute bottom-16 sm:bottom-14 left-4 z-40">
					{/* Chat Panel - Slides Up from Button */}
					{isChatOpen && (
						<div className="absolute bottom-16 left-0 w-80 sm:w-96 animate-slide-up">
							<div className="bg-base-100 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary overflow-hidden">
									{/* Chat Header - Modern Theme */}
									<div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b-2 border-primary/20 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
												<MessageSquare size={16} className="text-primary" />
											</div>
											<span className="font-bold text-base text-base-content">Chat</span>
										</div>
										<button 
											className="btn btn-ghost btn-xs btn-circle hover:bg-error/10 hover:text-error"
											onClick={toggleChat}
										>
											✕
										</button>
									</div>

									{/* Messages - Better Theme */}
									<div className="h-56 sm:h-64 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-base-200/30 to-base-200/50" style={{ WebkitOverflowScrolling: 'touch' }}>
										{tempMessages.length === 0 ? (
											<div className="text-center text-base-content/50 text-sm mt-12">
												<div className="text-4xl mb-2">💬</div>
												<p>No messages yet</p>
												<p className="text-xs mt-1">Say hi! 👋</p>
											</div>
										) : (
											tempMessages.map((msg, index) => (
												<div 
													key={index} 
													className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'} animate-fade-in`}
												>
													<div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm shadow-md ${
														msg.sender === 'You' 
															? 'bg-gradient-to-br from-primary to-primary/90 text-primary-content rounded-br-sm' 
															: msg.sender === 'System'
															? 'bg-gradient-to-br from-warning to-warning/90 text-warning-content rounded-lg'
															: 'bg-base-100 text-base-content rounded-bl-sm border-2 border-primary/20'
													}`}>
														{msg.message}
													</div>
												</div>
											))
										)}
									</div>

									{/* Message Input - Modern Theme */}
									<form onSubmit={handleSendTempMessage} className="p-3 bg-base-100 border-t-2 border-primary/20">
										<div className="flex gap-2">
											<input
												type="text"
												placeholder="Type a message..."
												className="input input-bordered input-sm flex-1 text-sm bg-base-200 border-2 border-primary/20 focus:border-primary"
												value={currentMessage}
												onChange={(e) => setCurrentMessage(e.target.value)}
												disabled={status !== "connected"}
											/>
											<button
												type="submit"
												disabled={status !== "connected" || !currentMessage.trim()}
												className="btn btn-primary btn-sm btn-circle"
											>
												<Send size={16} />
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

					{/* Floating Button - Always Visible */}
					<button
						onClick={toggleChat}
						className="btn btn-circle btn-outline btn-primary w-12 h-12 sm:w-14 sm:h-14 bg-base-100/90 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all border-2"
					>
						<MessageSquare size={20} className="sm:w-6 sm:h-6" />
						{/* Unread Badge */}
						{unreadCount > 0 && !isChatOpen && (
							<span className="absolute -top-1 -right-1 flex h-6 w-6">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
								<span className="relative inline-flex rounded-full h-6 w-6 bg-error items-center justify-center text-[10px] font-bold text-white border-2 border-base-100">
									{unreadCount > 9 ? '9+' : unreadCount}
								</span>
							</span>
						)}
					</button>
				</div>
			</div>


			<ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleSubmitReport} screenshotPreview={reportScreenshot} isSubmitting={isSubmittingReport} />
			
			{/* Custom Animations */}
			<style>{`
				@keyframes slide-up {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				
				.animate-slide-up {
					animation: slide-up 0.3s ease-out;
				}
				
				.animate-fade-in {
					animation: fade-in 0.3s ease-out;
				}
				
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
						transform: translateY(-450px) scale(1.3) rotate(15deg);
						opacity: 0.7;
					}
					100% {
						transform: translateY(-550px) scale(0.5) rotate(25deg);
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
