import { Phone, Video, PhoneIncoming, PhoneOutgoing } from "lucide-react";

const CallLogMessage = ({ message, isOwnMessage }) => {
  const { callData } = message;
  
  if (!callData) return null;

  const formatDuration = (seconds) => {
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

  const isVideo = callData.type === "video";
  const Icon = isVideo ? Video : Phone;
  const DirectionIcon = isOwnMessage ? PhoneOutgoing : PhoneIncoming;

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
          isOwnMessage ? 'text-primary' : 'text-base-content/70'
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
        </div>
        <p className="text-xs text-base-content/60">
          Duration: {formatDuration(callData.duration)}
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
