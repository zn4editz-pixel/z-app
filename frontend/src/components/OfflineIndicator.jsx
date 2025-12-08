import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const isOnline = useOfflineDetection();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show reconnected message briefly
      setShowReconnected(true);
      setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
        <div className="bg-success text-success-content px-4 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <Wifi size={18} />
          <span className="text-sm font-medium">Back online!</span>
        </div>
      </div>
    );
  }

  // Show offline indicator - subtle and non-intrusive
  if (!isOnline) {
    return (
      <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
        <div className="bg-base-100 border-2 border-warning text-base-content px-4 py-2 rounded-lg shadow-xl flex items-center gap-2">
          <WifiOff size={18} className="text-warning" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Offline Mode</span>
            <span className="text-xs opacity-70">Showing cached data</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
