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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/VerifiedBadge";
import { analyzeFrame, captureVideoFrame, MODERATION_CONFIG } from "../utils/contentModeration";

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
	const [permissionsGranted, setPermissionsGranted] = useState(false);
	const [tempMessages, setTempMessages] = useState([]);
	const [currentMessage, setCurrentMessage] = useState("");
	// ✅ FIX: Use null to track the partner's permanent ID
	const [partnerUserId, setPartnerUserId] = useState(null);
	const [partnerUserData, setPartnerUserData] = useState(null); // Store full partner data
	const [friendStatus, setFriendStatus] = useState("NOT_FRIENDS");
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [reportScreenshot, setReportScreenshot] = useState(null);
	const [isSubmittingReport, setIsSubmittingReport] = useState(false);

	const peerConnectionRef = useRef(null);
	const localStreamRef = useRef(null);
	const remoteStreamRef = useRef(null);
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const iceCandidateQueueRef = useRef([]);

	const addMessage = useCallback((sender, message) => {
		setTempMessages((prev) => [...prev, { sender, message }]);
	}, []);

	// --- WebRTC helper functions (unchanged from yours) ---
	const createPeerConnection = useCallback(() => {
		// ... (WebRTC connection logic) ...
		console.log("WebRTC: Creating PeerConnection");
		const pc = new RTCPeerConnection({
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" }
			]
		});

		pc.onicecandidate = (e) => {
			if (e.candidate && socket) {
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

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				pc.addTrack(track, localStreamRef.current);
			});
		}

		peerConnectionRef.current = pc;
		iceCandidateQueueRef.current = [];
		return pc;
	}, [socket]);

	const startCall = useCallback(async () => {
		// ... (startCall logic) ...
		console.log("WebRTC: Starting call as initiator");
		if (!localStreamRef.current) {
			console.error("No local stream!");
			return;
		}

		try {
			const pc = createPeerConnection();
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			console.log("WebRTC: Sending offer");
			socket.emit("webrtc:offer", { sdp: offer });
		} catch (err) {
			console.error("Error creating offer:", err);
		}
	}, [createPeerConnection, socket]);

	const handleOffer = useCallback(async (sdp) => {
		// ... (handleOffer logic) ...
		console.log("WebRTC: Received offer, creating answer");
		if (!localStreamRef.current) {
			console.error("No local stream for answer!");
			return;
		}

		try {
			const pc = createPeerConnection();
			await pc.setRemoteDescription(new RTCSessionDescription(sdp));
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			console.log("WebRTC: Sending answer");
			socket.emit("webrtc:answer", { sdp: answer });

			// Process queued ICE candidates
			iceCandidateQueueRef.current.forEach(candidate => {
				pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("ICE error:", e));
			});
			iceCandidateQueueRef.current = [];
		} catch (err) {
			console.error("Error handling offer:", err);
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
		iceCandidateQueueRef.current = [];
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
		if (!socket || !authUser) {
			toast.error("Connection error.");
			navigate("/");
			return;
		}

		let isMounted = true;
		let hasJoinedQueue = false;

		// Request camera and microphone permissions
		const requestPermissions = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ 
					video: true, 
					audio: true 
				});
				
				if (!isMounted) {
					stream.getTracks().forEach(t => t.stop());
					return;
				}
				
				localStreamRef.current = stream;
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				
				setStatus("waiting");
				
				if (!hasJoinedQueue) {
					socket.emit("stranger:joinQueue", { userId: authUser._id });
					hasJoinedQueue = true;
				}
			} catch (error) {
				console.error("Permission denied:", error);
				toast.error("Camera and microphone access required for stranger chat");
				navigate("/");
			}
		};
		
		requestPermissions();


		const onWaiting = () => {
			if (isMounted) setStatus("waiting");
		};

		const onMatched = (data) => {
			// ✅ FIX: Store the partner's permanent user ID and full data
			console.log("Socket: matched with", data.partnerId, "User ID:", data.partnerUserId); 
			if (isMounted) {
				addMessage("System", "Partner found!");
				setStatus("connected");
				setPartnerUserId(data.partnerUserId); // ✅ Store the permanent ID
				setPartnerUserData(data.partnerUserData); // ✅ Store full user data (username, nickname, isVerified)
				
				const shouldInitiate = socket.id < data.partnerId;
				console.log(`Should I initiate? ${shouldInitiate}`);
				
				if (shouldInitiate) {
					setTimeout(() => startCall(), 1000);
				}
			}
		};

		const onDisconnected = () => {
			if (isMounted) {
				addMessage("System", "Partner disconnected.");
				closeConnection(); 
				setStatus("waiting");
				socket.emit("stranger:joinQueue", { userId: authUser._id });
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
			socket.off("webrtc:offer", onOffer);
			socket.off("webrtc:answer", onAnswer);
			socket.off("webrtc:ice-candidate", onIce);
            socket.off("stranger:addFriendError", onAddFriendError);
            socket.off("stranger:reportSuccess", onReportSuccess);
            socket.off("stranger:reportError", onReportError);
		};
	// Added fetchFriendData as a dependency
	}, [socket, authUser, navigate, addMessage, closeConnection, startCall, handleOffer, handleAnswer, handleIceCandidate, fetchFriendData]); 

	// --- AI Content Moderation Effect ---
	useEffect(() => {
		if (!MODERATION_CONFIG.enabled || status !== 'connected' || !remoteVideoRef.current || !partnerUserId) {
			return;
		}

		let violations = 0;
		let moderationInterval;

		const checkContent = async () => {
			try {
				if (!remoteVideoRef.current || remoteVideoRef.current.readyState < 2) {
					return; // Video not ready yet
				}

				const analysis = await analyzeFrame(remoteVideoRef.current);
				
				if (!analysis.safe) {
					violations++;
					const confidence = analysis.highestRisk?.probability || 0;
					
					console.warn('⚠️ AI Moderation Alert:', {
						violations,
						confidence: `${(confidence * 100).toFixed(1)}%`,
						category: analysis.highestRisk?.className
					});

					if (confidence >= MODERATION_CONFIG.autoReportThreshold) {
						// High confidence - auto-report
						const screenshot = captureVideoFrame(remoteVideoRef.current);
						if (screenshot && socket) {
							socket.emit('stranger:report', {
								reporterId: authUser._id,
								reportedUserId: partnerUserId,
								reason: 'Nudity or Sexual Content',
								description: `AI detected: ${analysis.highestRisk?.className} (${(confidence * 100).toFixed(1)}% confidence)`,
								screenshot,
								category: 'stranger_chat',
								isAIDetected: true,
								aiConfidence: confidence,
								aiCategory: analysis.highestRisk?.className
							});
						}
						
						toast.error('Inappropriate content detected. Disconnecting and reporting.');
						handleSkip();
					} else if (violations >= MODERATION_CONFIG.maxViolations) {
						// Multiple violations - disconnect
						toast.error('Multiple content violations detected. Disconnecting.');
						handleSkip();
					} else {
						// Warning
						toast.warning(`Warning: Potentially inappropriate content detected (${violations}/${MODERATION_CONFIG.maxViolations})`);
					}
				}
			} catch (error) {
				console.error('AI Moderation error:', error);
			}
		};

		// Start checking after a short delay to let video stabilize
		const startTimeout = setTimeout(() => {
			moderationInterval = setInterval(checkContent, MODERATION_CONFIG.checkInterval);
		}, 3000);

		return () => {
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
		// ✅ FIX: Only allow sending if we know the partner's ID
		if (status !== "connected" || !partnerUserId) return; 
		
		// The button text will update immediately because the useEffect hook runs
		socket.emit("stranger:addFriend", { partnerUserId }); 
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
		if (!reportScreenshot || !reason) return;
		setIsSubmittingReport(true);
		socket.emit("stranger:report", {
			reporterId: authUser._id,
			reason,
			description: "Reported from stranger chat",
			screenshot: reportScreenshot
		});
	};

	return (
		<div className="h-screen pt-12 xs:pt-14 sm:pt-16 flex flex-col bg-gradient-to-br from-base-300 via-base-200 to-base-300">
			<div className="flex-1 flex flex-col md:flex-row gap-3 p-3 md:p-4 overflow-hidden">
				{/* Video Section - Optimized for Remote Video Visibility */}
				<div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-black to-gray-900 rounded-xl md:rounded-2xl shadow-2xl border border-base-content/10">
					{/* Remote Video - Full Focus */}
					<div className="w-full h-full relative rounded-xl md:rounded-2xl overflow-hidden">
						<video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover md:object-contain" />
						{status === "waiting" && (
							<div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-gradient-to-b from-black/90 to-black/70 backdrop-blur-sm">
								<Loader2 className="w-14 h-14 md:w-20 md:h-20 animate-spin text-primary drop-shadow-lg" />
								<p className="text-lg md:text-2xl font-bold drop-shadow-lg">Finding a partner...</p>
							</div>
						)}
						{status === "connected" && (
							<button onClick={handleReport} className="btn btn-error btn-xs md:btn-sm absolute top-3 right-3 opacity-90 hover:opacity-100 z-20 flex items-center gap-1 shadow-xl backdrop-blur-sm">
								<AlertTriangle size={14} /> Report
							</button>
						)}
						
						{/* Self Camera - Smaller on Mobile for Better Remote View */}
						<div className="w-20 h-28 md:w-44 md:h-auto md:aspect-video lg:w-52 bg-gradient-to-b from-gray-800 to-black rounded-lg md:rounded-xl overflow-hidden absolute bottom-3 right-3 md:bottom-4 md:right-4 border-2 border-primary shadow-2xl z-20 ring-2 ring-primary/20">
							<video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
						</div>
					</div>
				</div>

				{/* Chat Sidebar - Compact on Mobile */}
				<div className="w-full md:w-80 lg:w-96 h-[40vh] md:h-full flex flex-col bg-gradient-to-b from-base-100 to-base-200 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden border border-base-content/10">
					{/* Action Buttons */}
					<div className="flex items-center gap-2 p-3 border-b border-base-300 bg-gradient-to-r from-base-200 to-base-100">
						<button onClick={handleSkip} className="btn btn-primary btn-sm flex-1 gap-1 shadow-md hover:shadow-lg transition-all" disabled={status === "idle"}>
							<SkipForward size={16} /> {status === "connected" ? "Skip" : "Find"}
						</button>
						<button onClick={() => navigate("/")} className="btn btn-error btn-sm gap-1 shadow-md hover:shadow-lg transition-all">
							<PhoneOff size={16} /> Leave
						</button>
					</div>
					
					{/* Add Friend Button */}
					<div className="p-3 border-b border-base-300">
						<button
							className="btn btn-secondary btn-sm w-full gap-1 shadow-md hover:shadow-lg transition-all"
							disabled={status !== "connected" || friendStatus === "REQUEST_SENT" || friendStatus === "FRIENDS"}
							onClick={handleAddFriend}
						>
							<UserPlus size={16} />
							{friendStatus === "NOT_FRIENDS" && "Add Friend"}
							{friendStatus === "REQUEST_SENT" && "Request Sent"}
							{friendStatus === "REQUEST_RECEIVED" && "Pending Request"}
							{friendStatus === "FRIENDS" && "Friends"}
						</button>
					</div>
					
					{/* Chat Area */}
					<div className="flex-1 flex flex-col overflow-hidden">
						<div className="p-3 pb-0">
							<h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
								<MessageSquare size={18} /> Temp Chat
							</h3>
						</div>
						<div className="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent">
							{tempMessages.map((msg, index) => (
								<div key={index} className={`chat ${msg.sender === 'You' ? 'chat-end' : 'chat-start'}`}>
									<div className={`chat-bubble text-xs md:text-sm py-2 px-3 shadow-md ${msg.sender === 'You' ? 'chat-bubble-primary' : (msg.sender === 'System' ? 'chat-bubble-accent' : 'chat-bubble-secondary')}`}>
										{msg.message}
									</div>
								</div>
							))}
						</div>
						{/* Sticky Message Input - Moves with Keyboard */}
						<form onSubmit={handleSendTempMessage} className="flex gap-2 p-3 bg-base-100 border-t border-base-300 sticky bottom-0 z-10" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
							<input 
								type="text" 
								placeholder="Type a message..." 
								className="input input-sm input-bordered flex-1 text-sm bg-base-200 focus:ring-2 focus:ring-primary/50 transition-all" 
								value={currentMessage} 
								onChange={(e) => setCurrentMessage(e.target.value)} 
								disabled={status !== "connected"} 
							/>
							<button type="submit" className="btn btn-primary btn-sm btn-circle shadow-md hover:shadow-lg transition-all" disabled={status !== "connected" || !currentMessage.trim()}>
								<Send size={16} />
							</button>
						</form>
					</div>
				</div>
			</div>

			<ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleSubmitReport} screenshotPreview={reportScreenshot} isSubmitting={isSubmittingReport} />
		</div>
	);
};

export default StrangerChatPage;
