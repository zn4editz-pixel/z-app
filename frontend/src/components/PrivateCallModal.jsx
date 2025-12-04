import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff as VideoOffIcon, Maximize2, Minimize2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const callTimerRef = useRef(null);

  const endCall = useCallback(() => {
    stopCallTimer();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socket && otherUser) {
      socket.emit("private:end-call", { targetUserId: otherUser._id });
    }

    setCallStatus("ended");
    if (onCallEnd) onCallEnd();
    setTimeout(() => onClose(), 500);
  }, [socket, otherUser, onClose, onCallEnd]);

  const createPeerConnection = useCallback(() => {
    console.log("Creating peer connection");
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
          targetUserId: otherUser._id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log("Received remote track");
      if (e.streams && e.streams[0]) {
        remoteStreamRef.current = e.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          console.log("Remote video stream set");
        }
        setCallStatus("active");
        startCallTimer();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "failed") {
        console.error("Connection failed");
        toast.error("Connection failed");
        onClose();
      } else if (pc.connectionState === "disconnected") {
        console.log("Connection disconnected");
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      console.log("Adding local tracks to peer connection");
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn("No local stream available when creating peer connection");
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
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: callType === "video" ? {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user"
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Error accessing media:", error);
      toast.error("Could not access camera/microphone");
      onClose();
      return null;
    }
  }, [callType, onClose]);

  const startCall = useCallback(async () => {
    const stream = await initializeMedia();
    if (!stream) return;

    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("private:initiate-call", {
      receiverId: otherUser._id,
      callerInfo: {
        _id: authUser._id,
        nickname: authUser.nickname,
        profilePic: authUser.profilePic,
      },
      callType,
    });

    socket.emit("private:offer", {
      receiverId: otherUser._id,
      sdp: offer,
    });

    setCallStatus("ringing");
  }, [initializeMedia, createPeerConnection, socket, otherUser, authUser, callType]);

  const answerCall = useCallback(async () => {
    const stream = await initializeMedia();
    if (!stream) return;

    setCallStatus("connecting");
  }, [initializeMedia]);

  const handleOffer = useCallback(async (sdp) => {
    console.log("Received offer, creating peer connection");
    
    // Make sure we have local stream first
    if (!localStreamRef.current) {
      console.log("No local stream, initializing media first");
      const stream = await initializeMedia();
      if (!stream) return;
    }
    
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    console.log("Sending answer back");
    socket.emit("private:answer", {
      callerId: otherUser._id,
      sdp: answer,
    });

    socket.emit("private:call-accepted", {
      callerId: otherUser._id,
      acceptorInfo: {
        _id: authUser._id,
        nickname: authUser.nickname,
        profilePic: authUser.profilePic,
      },
    });

    // Process queued ICE candidates
    iceCandidateQueueRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    iceCandidateQueueRef.current = [];
  }, [createPeerConnection, socket, otherUser, authUser, initializeMedia]);

  const handleAnswer = useCallback(async (sdp) => {
    console.log("Received answer");
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error("No peer connection found");
      return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    console.log("Remote description set");

    // Process queued ICE candidates
    iceCandidateQueueRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    iceCandidateQueueRef.current = [];
  }, []);

  const handleIceCandidate = useCallback((candidate) => {
    console.log("Received ICE candidate");
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      console.log("Queueing ICE candidate");
      iceCandidateQueueRef.current.push(candidate);
    } else {
      console.log("Adding ICE candidate");
      pc.addIceCandidate(new RTCIceCandidate(candidate));
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

    if (isInitiator) {
      startCall();
    } else {
      answerCall();
    }

    const handleOfferEvent = ({ sdp }) => handleOffer(sdp);
    const handleAnswerEvent = ({ sdp }) => handleAnswer(sdp);
    const handleIceCandidateEvent = ({ candidate }) => handleIceCandidate(candidate);
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
    const handleCallRejected = () => {
      console.log("Call rejected by other user");
      toast.error("Call declined");
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
    const handleCallAccepted = () => setCallStatus("connecting");

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
      
      stopCallTimer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, socket, otherUser, isInitiator, startCall, answerCall, handleOffer, handleAnswer, handleIceCandidate, endCall]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <img
              src={otherUser?.profilePic || "/avatar.png"}
              alt={otherUser?.nickname}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full ring-2 ring-primary/50 shadow-lg"
            />
            {callStatus === "active" && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full ring-2 ring-black animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg">
              {otherUser?.nickname || otherUser?.username}
            </h3>
            <p className="text-white/70 text-xs sm:text-sm flex items-center gap-2">
              {callStatus === "connecting" && (
                <>
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Connecting...
                </>
              )}
              {callStatus === "ringing" && (
                <>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  Ringing...
                </>
              )}
              {callStatus === "active" && (
                <>
                  <span className="inline-block w-2 h-2 bg-success rounded-full" />
                  {formatDuration(callDuration)}
                </>
              )}
              {callStatus === "ended" && "Call Ended"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="btn btn-ghost btn-circle btn-sm sm:btn-md text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {callType === "video" ? (
          <>
            {/* Remote Video - Full Screen */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* No Remote Video Placeholder */}
            {!remoteStreamRef.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <img
                    src={otherUser?.profilePic || "/avatar.png"}
                    alt={otherUser?.nickname}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full object-cover"
                  />
                </div>
                <p className="text-white/70 text-sm sm:text-base">Waiting for video...</p>
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-20 h-28 sm:w-28 sm:h-36 md:w-36 md:h-48 lg:w-40 lg:h-52 bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transition-all hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  <VideoOffIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white/50 mb-2" />
                  <span className="text-white/50 text-xs">Camera Off</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio Call UI */
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 p-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <img
                src={otherUser?.profilePic || "/avatar.png"}
                alt={otherUser?.nickname}
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full ring-4 ring-primary/30 shadow-2xl object-cover"
              />
              {callStatus === "active" && (
                <span className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 bg-success rounded-full ring-4 ring-black animate-pulse" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                {otherUser?.nickname || otherUser?.username}
              </h2>
              <p className="text-white/60 text-sm sm:text-base">
                {callStatus === "ringing" && "Calling..."}
                {callStatus === "connecting" && "Connecting..."}
                {callStatus === "active" && "Voice Call"}
              </p>
            </div>
            {/* Audio Visualizer */}
            {callStatus === "active" && (
              <div className="flex items-center gap-1 sm:gap-2 h-12 sm:h-16">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 sm:w-1.5 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`btn btn-circle btn-md sm:btn-lg transition-all ${
              isMuted 
                ? "btn-error hover:btn-error" 
                : "bg-white/10 text-white hover:bg-white/20 border-white/20"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="btn btn-circle btn-lg sm:btn-xl bg-error hover:bg-error/80 border-none shadow-2xl scale-110 sm:scale-125"
            title="End call"
          >
            <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Video Toggle (only for video calls) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`btn btn-circle btn-md sm:btn-lg transition-all ${
                isVideoOff 
                  ? "btn-error hover:btn-error" 
                  : "bg-white/10 text-white hover:bg-white/20 border-white/20"
              }`}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? <VideoOffIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}
        </div>
        
        {/* Status Text */}
        <p className="text-center text-white/50 text-xs sm:text-sm mt-4">
          {isMuted && "Microphone muted"}
          {isVideoOff && callType === "video" && " • Camera off"}
        </p>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        .btn-xl {
          width: 4rem;
          height: 4rem;
        }
        @media (min-width: 640px) {
          .btn-xl {
            width: 5rem;
            height: 5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivateCallModal;
