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

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("private:ice-candidate", {
          targetUserId: otherUser._id,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        remoteStreamRef.current = e.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
        setCallStatus("active");
        startCallTimer();
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall();
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, otherUser]);

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
        audio: true,
        video: callType === "video" ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Error accessing media:", error);
      toast.error("Could not access camera/microphone");
      endCall();
      return null;
    }
  }, [callType]);

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
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

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

    iceCandidateQueueRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    iceCandidateQueueRef.current = [];
  }, [createPeerConnection, socket, otherUser, authUser]);

  const handleAnswer = useCallback(async (sdp) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));

    iceCandidateQueueRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    iceCandidateQueueRef.current = [];
  }, []);

  const handleIceCandidate = useCallback((candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      iceCandidateQueueRef.current.push(candidate);
    } else {
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

    if (socket) {
      socket.emit("private:end-call", { targetUserId: otherUser._id });
    }

    setCallStatus("ended");
    if (onCallEnd) onCallEnd();
    setTimeout(() => onClose(), 500);
  }, [socket, otherUser, onClose, onCallEnd]);

  useEffect(() => {
    if (!isOpen || !socket) return;

    if (isInitiator) {
      startCall();
    } else {
      answerCall();
    }

    const handleOfferEvent = ({ sdp }) => handleOffer(sdp);
    const handleAnswerEvent = ({ sdp }) => handleAnswer(sdp);
    const handleIceCandidateEvent = ({ candidate }) => handleIceCandidate(candidate);
    const handleCallEnded = () => endCall();
    const handleCallAccepted = () => setCallStatus("connecting");

    socket.on("private:offer", handleOfferEvent);
    socket.on("private:answer", handleAnswerEvent);
    socket.on("private:ice-candidate", handleIceCandidateEvent);
    socket.on("private:call-ended", handleCallEnded);
    socket.on("private:call-accepted", handleCallAccepted);

    return () => {
      socket.off("private:offer", handleOfferEvent);
      socket.off("private:answer", handleAnswerEvent);
      socket.off("private:ice-candidate", handleIceCandidateEvent);
      socket.off("private:call-ended", handleCallEnded);
      socket.off("private:call-accepted", handleCallAccepted);
      
      stopCallTimer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, socket, isInitiator, startCall, answerCall, handleOffer, handleAnswer, handleIceCandidate, endCall]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${isFullscreen ? "" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <img
            src={otherUser.profilePic || "/avatar.png"}
            alt={otherUser.nickname}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-white/20"
          />
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base">
              {otherUser.nickname || otherUser.username}
            </h3>
            <p className="text-white/70 text-xs sm:text-sm">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "active" && formatDuration(callDuration)}
              {callStatus === "ended" && "Call Ended"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="btn btn-ghost btn-circle btn-sm text-white"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Local Video (Picture-in-Picture) */}
        {callType === "video" && (
          <div className="absolute bottom-24 sm:bottom-28 right-2 sm:right-4 w-28 h-36 sm:w-36 sm:h-48 md:w-44 md:h-56 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOffIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
              </div>
            )}
          </div>
        )}

        {/* Audio Call Avatar */}
        {callType === "audio" && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={otherUser.profilePic || "/avatar.png"}
              alt={otherUser.nickname}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ring-white/20"
            />
            <h2 className="text-white text-xl sm:text-2xl font-semibold">
              {otherUser.nickname || otherUser.username}
            </h2>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`btn btn-circle btn-md sm:btn-lg ${isMuted ? "btn-error" : "btn-ghost bg-white/10 text-white hover:bg-white/20"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Video Toggle (only for video calls) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`btn btn-circle btn-md sm:btn-lg ${isVideoOff ? "btn-error" : "btn-ghost bg-white/10 text-white hover:bg-white/20"}`}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? <VideoOffIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="btn btn-circle btn-md sm:btn-lg btn-error shadow-lg"
            title="End call"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default PrivateCallModal;
