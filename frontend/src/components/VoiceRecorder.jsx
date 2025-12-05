import { useState, useRef, useEffect } from "react";
import { Mic, X, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const VoiceRecorder = ({ onSendVoice, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    setIsSending(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        await onSendVoice(base64Audio, recordingTime);
        cancelRecording();
        toast.success("Voice message sent!");
      };
    } catch (error) {
      console.error("Error sending voice:", error);
      toast.error("Failed to send voice message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Preview state - after recording
  if (audioBlob) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-base-100 border-t-2 border-primary shadow-2xl">
        <div className="max-w-2xl mx-auto p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              Voice Message
            </h3>
            <span className="text-xs sm:text-sm font-mono bg-base-200 px-2 py-1 rounded">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Audio Player */}
          <audio 
            src={audioURL} 
            controls 
            className="w-full mb-3 h-10 sm:h-12"
            style={{ outline: 'none' }}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={cancelRecording}
              className="btn btn-ghost flex-1 gap-2"
              disabled={isSending}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              onClick={sendVoiceMessage}
              className="btn btn-primary flex-1 gap-2"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-base-100 border-t border-base-300 shadow-lg">
        <div className="max-w-2xl mx-auto p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Recording indicator */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-base-content/70">Recording</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-error">{formatTime(recordingTime)}</p>
              </div>
            </div>

            {/* Stop button */}
            <button
              onClick={stopRecording}
              className="btn btn-error gap-2"
            >
              <div className="w-3 h-3 bg-white rounded-sm" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default button
  return (
    <button
      onClick={startRecording}
      className="btn btn-ghost btn-circle btn-sm sm:btn-md hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
      disabled={disabled}
      title="Record voice message"
    >
      <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  );
};

export default VoiceRecorder;
