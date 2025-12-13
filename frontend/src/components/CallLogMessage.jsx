import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff } from "lucide-react";

const CallLogMessage = ({ message, isOwnMessage }) => {
  // Handle both old callData format and new direct message format
  const callData = message.callData || {
    type: message.callType,
    duration: message.callDuration || 0,
    status: message.callStatus || 'completed',
    timestamp: message.createdAt
  };
  
  if (!message.isCallLog && !callData) return null;

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) {
      return "0 seconds";
    }
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  };

  const getCallStatus = () => {
    const status = callData.status || 'completed';
    const duration = callData.duration || 0;
    
    if (status === 'rejected' || status === 'declined') {
      return { text: 'Declined', color: 'text-error' };
    }
    if (status === 'missed') {
      return { text: 'Missed', color: 'text-warning' };
    }
    if (status === 'failed') {
      return { text: 'Failed', color: 'text-error' };
    }
    if (duration === 0) {
      return { text: 'No answer', color: 'text-base-content/50' };
    }
    return { text: 'Completed', color: 'text-success' };
  };

  const getCallIcon = () => {
    const status = callData.status || 'completed';
    const isVideo = callData.type === "video";
    
    if (status === 'missed' || status === 'rejected' || status === 'failed') {
      return PhoneMissed;
    }
    if (isVideo) {
      return Video;
    }
    return Phone;
  };

  const isVideo = callData.type === "video";
  const Icon = getCallIcon();
  const DirectionIcon = isOwnMessage ? PhoneOutgoing : PhoneIncoming;
  const statusInfo = getCallStatus();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isOwnMessage 
        ? 'bg-primary/10 border border-primary/20' 
        : 'bg-base-200 border border-base-300'
    }`}>
      <div className={`p-2 rounded-full ${
        isOwnMessage ? 'bg-primary/20' : 'bg-base-300'
      }`}>
        <Icon className={`w-4 h-4 ${
          statusInfo.color === 'text-error' || statusInfo.color === 'text-warning' 
            ? statusInfo.color
            : isOwnMessage ? 'text-primary' : 'text-base-content/70'
        }`} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <DirectionIcon className={`w-3 h-3 ${
            isOwnMessage ? 'text-primary' : 'text-base-content/50'
          }`} />
          <span className={`text-sm font-medium ${
            isOwnMessage ? 'text-primary' : 'text-base-content/70'
          }`}>
            {isOwnMessage ? 'Outgoing' : 'Incoming'} {isVideo ? 'Video' : 'Voice'} Call
          </span>
          <span className={`text-xs ${statusInfo.color}`}>
            • {statusInfo.text}
          </span>
        </div>
        <p className="text-xs text-base-content/60">
          {callData.duration > 0 ? `Duration: ${formatDuration(callData.duration)}` : 'No connection established'}
        </p>
      </div>
      
      <div className="text-xs text-base-content/40">
        {new Date(callData.timestamp || message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
};

export default CallLogMessage;
