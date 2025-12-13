import { useEffect, useRef, useState, useCallback } from "react";
import { Video, PhoneOff, Mic, MicOff, VideoOff as VideoOffIcon, Maximize2, Minimize2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { 
  initNSFWModel, 
  analyzeFrame, 
  captureVideoFrame, 
  MODERATION_CONFIG,
  formatAIReport 
} from "../utils/contentModeration";
import "../styles/call-modal.css";

const PrivateCallModal = ({ 
  isOpen, 
  onClose, 
  callType, 
  isInitiator, 
  otherUser,
  onCallEnd 
}) => {
  const { socket, authUser } = useAuthStore();
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, ringing, active, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // AI Moderation state
  const [violations, setViolations] = useState(0);
  const moderationIntervalRef = useRef(null);
  const lastReportTimeRef = useRef(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const callTimerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  const endCall = useCallback(async () => {
    console.log("🔚 Ending call...");
    stopCallTimer();
    
    // Save call duration before cleanup
    const finalDuration = callDuration;
    
    // Stop all local media tracks
    if (localStreamRef.current) {
      console.log("🛑 Stopping local media tracks");
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      console.log("🔌 Closing peer connection");
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
    }

    // Notify other user
    if (socket && otherUser) {
      console.log("📤 Notifying other user of call end");
      socket.emit("private:end-call", { targetUserId: otherUser.id });
    }

    // Create call log if call was active (duration > 0)
    if (finalDuration > 0 && otherUser) {
      try {
        const { axiosInstance } = await import("../lib/axios.js");
        await axiosInstance.post("/messages/call-log", {
          receiverId: otherUser.id,
          callType: callType,
          duration: finalDuration
        });
        console.log(`✅ Call log created: ${callType} call, ${finalDuration}s`);
      } catch (error) {
        console.error("Failed to create call log:", error);
      }
    }

    setCallStatus("ended");
    if (onCallEnd && typeof onCallEnd === 'function') {
      onCallEnd(finalDuration);
    }
    setTimeout(() => {
      console.log("✅ Call cleanup complete, closing modal");
      onClose();
    }, 500);
  }, [socket, otherUser, onClose, onCallEnd, callDuration, callType]);

  const createPeerConnection = useCallback(() => {
    console.log(`Creating peer connection for ${callType} call`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        console.log("Sending ICE candidate");
        socket.emit("private:ice-candidate", {
          targetUserId: otherUser.id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log("🎉 Received remote track!", e.track.kind, "readyState:", e.track.readyState);
      if (e.streams && e.streams[0]) {
        console.log("📺 Remote stream has", e.streams[0].getTracks().length, "tracks:", 
          e.streams[0].getTracks().map(t => `${t.kind} (${t.readyState})`));
        remoteStreamRef.current = e.streams[0];
        
        // Set remote stream to appropriate element
        if (callType === "video" && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          // Ensure autoplay works
          remoteVideoRef.current.play().then(() => {
            console.log("✅ Remote video stream playing");
          }).catch(err => {
            console.error("❌ Error playing remote video:", err);
            // Try to play again after user interaction
            setTimeout(() => {
              remoteVideoRef.current?.play().catch(e => console.error("Retry failed:", e));
            }, 1000);
          });
        } else if (callType === "audio" && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().then(() => {
            console.log("✅ Remote audio stream playing");
          }).catch(err => {
            console.error("❌ Error playing remote audio:", err);
            // Try to play again
            setTimeout(() => {
              remoteAudioRef.current?.play().catch(e => console.error("Retry failed:", e));
            }, 1000);
          });
        }
        
        console.log("✅ Setting call status to ACTIVE and starting timer");
        setCallStatus("active");
        startCallTimer();
        toast.success("Call connected!");
      } else {
        console.warn("⚠️ ontrack fired but no streams available");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection state changed:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("✅ WebRTC connection established!");
      } else if (pc.connectionState === "failed") {
        console.error("❌ Connection failed");
        toast.error("Connection failed");
        onClose();
      } else if (pc.connectionState === "disconnected") {
        console.log("⚠️ Connection disconnected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Adding ${tracks.length} local tracks to peer connection:`, 
        tracks.map(t => `${t.kind} (enabled: ${t.enabled})`));
      tracks.forEach((track) => {
        const sender = pc.addTrack(track, localStreamRef.current);
        console.log(`✅ Added ${track.kind} track, sender:`, sender);
      });
    } else {
      console.warn("⚠️ No local stream available when creating peer connection");
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, otherUser, onClose]);

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const initializeMedia = useCallback(async () => {
    try {
      console.log(`🎤 Initializing media for ${callType} call`);
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "video" ? {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user"
        } : false,
      };

      console.log("📹 Requesting media with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      console.log(`✅ Got local stream with ${stream.getTracks().length} tracks:`, 
        stream.getTracks().map(t => `${t.kind} (enabled: ${t.enabled}, label: ${t.label})`));

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video to prevent echo
        console.log("✅ Local video element set and muted");
      }

      return stream;
    } catch (error) {
      console.error("❌ Error accessing media:", error);
      toast.error(`Could not access ${callType === "video" ? "camera/microphone" : "microphone"}`);
      onClose();
      return null;
    }
  }, [callType, onClose]);

  const startCall = useCallback(async () => {
    console.log("📞 Starting call as initiator");
    const stream = await initializeMedia();
    if (!stream) {
      console.error("❌ Failed to get media stream");
      return;
    }

    console.log("✅ Media stream obtained, creating peer connection");
    const pc = createPeerConnection();
    
    console.log("📝 Creating offer");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("✅ Local description set");

    console.log("📤 Sending initiate-call signal");
    socket.emit("private:initiate-call", {
      receiverId: otherUser.id,
      callerInfo: {
        id: authUser.id,
        nickname: authUser.nickname,
        profilePic: authUser.profilePic,
      },
      callType,
    });

    setCallStatus("ringing");
    console.log("⏳ Call status set to ringing, waiting for receiver to accept");

    // Store offer to send later when receiver accepts
    window.pendingOffer = { receiverId: otherUser.id, sdp: offer };
  }, [initializeMedia, createPeerConnection, socket, otherUser, authUser, callType]);

  const answerCall = useCallback(async () => {
    console.log("Answering call - initializing media");
    const stream = await initializeMedia();
    if (!stream) return;

    console.log("Media initialized, waiting for offer");
    setCallStatus("connecting");
    // Don't create peer connection yet - wait for offer
  }, [initializeMedia]);

  const handleOffer = useCallback(async (sdp) => {
    console.log("📥 Received offer from caller, creating peer connection");
    
    // Make sure we have local stream first
    if (!localStreamRef.current) {
      console.log("⚠️ No local stream, initializing media first");
      const stream = await initializeMedia();
      if (!stream) {
        console.error("❌ Failed to initialize media");
        toast.error("Failed to access camera/microphone");
        endCall();
        return;
      }
    }
    
    console.log("✅ Local stream ready, creating peer connection");
    const pc = createPeerConnection();
    
    try {
      console.log("📝 Setting remote description (offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("✅ Remote description set");
      
      console.log("📝 Creating answer");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("✅ Local description (answer) set");

      console.log("📤 Sending answer back to caller");
      socket.emit("private:answer", {
        callerId: otherUser.id,
        sdp: answer,
      });

      console.log("✅ Answer sent, waiting for ICE candidates and tracks");

      // Process queued ICE candidates
      console.log(`🧊 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
      iceCandidateQueueRef.current.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
          console.error("Error adding ICE candidate:", err);
        });
      });
      iceCandidateQueueRef.current = [];
    } catch (error) {
      console.error("❌ Error handling offer:", error);
      toast.error("Failed to establish connection");
      endCall();
    }
  }, [createPeerConnection, socket, otherUser, initializeMedia, endCall]);

  const handleAnswer = useCallback(async (sdp) => {
    console.log("📥 Received answer from receiver");
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error("❌ No peer connection found when handling answer");
      return;
    }

    try {
      console.log("📝 Setting remote description (answer)");
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("✅ Remote description set successfully");

      // Process queued ICE candidates
      console.log(`🧊 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
      iceCandidateQueueRef.current.forEach((candidate) => {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
          console.error("Error adding ICE candidate:", err);
        });
      });
      iceCandidateQueueRef.current = [];
      
      console.log("✅ Answer processed, waiting for tracks...");
    } catch (error) {
      console.error("❌ Error handling answer:", error);
      toast.error("Failed to establish connection");
      endCall();
    }
  }, [endCall]);

  const handleIceCandidate = useCallback((candidate) => {
    console.log("🧊 Received ICE candidate");
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      console.log("⏳ Queueing ICE candidate (no remote description yet)");
      iceCandidateQueueRef.current.push(candidate);
    } else {
      console.log("✅ Adding ICE candidate immediately");
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
        console.error("❌ Error adding ICE candidate:", err);
      });
    }
  }, []);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === "video") {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };



  useEffect(() => {
    if (!isOpen || !socket || !otherUser) return;

    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log("⚠️ Already initialized, skipping");
      return;
    }
    hasInitializedRef.current = true;

    if (isInitiator) {
      startCall();
    } else {
      answerCall();
    }

    const handleOfferEvent = ({ sdp }) => handleOffer(sdp);
    const handleAnswerEvent = ({ sdp }) => handleAnswer(sdp);
    const handleIceCandidateEvent = ({ candidate }) => handleIceCandidate(candidate);
    const handleCallAccepted = () => {
      if (isInitiator && window.pendingOffer) {
        console.log("✅ Call accepted by receiver, sending offer now");
        socket.emit("private:offer", window.pendingOffer);
        console.log("📤 Offer sent to receiver");
        delete window.pendingOffer;
      }
    };
    const handleCallEnded = () => {
      console.log("Call ended by other user");
      toast("Call ended", { icon: "📞" });
      // Close modal immediately
      stopCallTimer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setCallStatus("ended");
      onClose();
    };
    const handleCallRejected = (data) => {
      console.log("🚫 Received call-rejected event:", data, "isInitiator:", isInitiator);
      
      // Only handle rejection if we're the initiator (caller)
      if (!isInitiator) {
        console.log("⚠️ Ignoring call-rejected event (not initiator)");
        return;
      }
      
      // Verify this rejection is for our call
      if (data.rejectorId && data.rejectorId !== otherUser?.id) {
        console.log("⚠️ Rejection from different user, ignoring");
        return;
      }
      
      console.log("❌ Call rejected by other user");
      toast.error("Call declined");
      endCall(); // Use endCall to ensure proper cleanup
    };

    socket.on("private:offer", handleOfferEvent);
    socket.on("private:answer", handleAnswerEvent);
    socket.on("private:ice-candidate", handleIceCandidateEvent);
    socket.on("private:call-ended", handleCallEnded);
    socket.on("private:call-rejected", handleCallRejected);
    socket.on("private:call-accepted", handleCallAccepted);

    return () => {
      socket.off("private:offer", handleOfferEvent);
      socket.off("private:answer", handleAnswerEvent);
      socket.off("private:ice-candidate", handleIceCandidateEvent);
      socket.off("private:call-ended", handleCallEnded);
      socket.off("private:call-rejected", handleCallRejected);
      socket.off("private:call-accepted", handleCallAccepted);
      
      // Clean up pending offer
      delete window.pendingOffer;
      
      stopCallTimer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      // Reset initialization flag
      hasInitializedRef.current = false;
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="call-modal fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Call Status Bar - Always Visible */}
      <div className="call-status-bar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
              <img src={otherUser?.profilePic || "/avatar.png"} alt={otherUser?.nickname} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {otherUser?.nickname || otherUser?.username}
              </h3>
              <p className="text-xs text-white/70">
                {callStatus === "active" ? formatDuration(callDuration) : callStatus === "connecting" ? "Connecting..." : "Ringing..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-white/70 capitalize font-medium">{callType} Call</span>
          </div>
        </div>
      </div>

      {/* Main Video Area - True Full Screen */}
      <div className="flex-1 relative bg-black min-h-0" style={{ marginTop: callType === "video" ? '60px' : '60px' }}>
        {callType === "video" ? (
          <>
            {/* Remote Video - Complete Fullscreen */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video - Picture in Picture */}
            <div className="absolute top-4 right-4 z-40">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-24 h-32 sm:w-28 sm:h-36 object-cover bg-gray-800 rounded-lg shadow-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
            
            {/* Completely Transparent Floating Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Mute Button - Fully Transparent */}
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isMuted 
                      ? 'bg-red-500/60 hover:bg-red-500/80' 
                      : 'bg-black/30 hover:bg-black/50'
                  } backdrop-blur-sm border border-white/20 shadow-xl hover:scale-110 active:scale-95`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>

                {/* End Call Button - Slightly More Visible */}
                <button
                  onClick={endCall}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-red-500/70 hover:bg-red-600/80 backdrop-blur-sm border border-red-400/30 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                  title="End call"
                >
                  <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </button>

                {/* Video Toggle Button - Fully Transparent */}
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isVideoOff 
                      ? 'bg-red-500/60 hover:bg-red-500/80' 
                      : 'bg-black/30 hover:bg-black/50'
                  } backdrop-blur-sm border border-white/20 shadow-xl hover:scale-110 active:scale-95`}
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isVideoOff ? <VideoOffIcon className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            {/* Video Placeholder */}
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="avatar mb-6">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white/20">
                      <img src={otherUser?.profilePic || "/avatar.png"} alt={otherUser?.nickname} />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                    {otherUser?.nickname || otherUser?.username}
                  </h3>
                  <p className="text-white/70 text-base">
                    {callStatus === "connecting" ? "Connecting..." : "Waiting for video..."}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Audio Call - Keep Bottom Bar for Audio */
          <>
            <div className="flex items-center justify-center h-full" style={{ marginBottom: '140px' }}>
              <div className="text-center">
                <div className="avatar mb-8">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full ring-4 ring-blue-400 ring-offset-4 ring-offset-black">
                    <img src={otherUser?.profilePic || "/avatar.png"} alt={otherUser?.nickname} />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  {otherUser?.nickname || otherUser?.username}
                </h2>
                <p className="text-white/70 text-lg">
                  {callStatus === "active" ? formatDuration(callDuration) : "Connecting..."}
                </p>
              </div>
            </div>
            
            {/* Audio Call Controls - Bottom Bar */}
            <div className="call-controls">
              <div className="flex items-center justify-center gap-6 sm:gap-8 mb-4">
                {/* Mute Button */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className={`call-control-btn btn btn-circle btn-lg ${isMuted ? 'mute-btn-active' : 'mute-btn-inactive'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <span className="text-xs text-white/70 font-medium">{isMuted ? "Muted" : "Mic"}</span>
                </div>

                {/* End Call Button */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={endCall}
                    className="end-call-btn btn btn-circle"
                    title="End call"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                  <span className="text-xs text-white/70 font-medium">End Call</span>
                </div>
              </div>

              {/* Call Info */}
              <div className="text-center">
                <p className="text-sm text-white/60">
                  {callStatus === "active" && `Duration: ${formatDuration(callDuration)}`}
                  {callStatus === "connecting" && "Establishing secure connection..."}
                  {callStatus === "ringing" && "Calling..."}
                </p>
              </div>
            </div>
          </>
        )}
        
        {/* Audio element for audio calls */}
        {callType === "audio" && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default PrivateCallModal;
