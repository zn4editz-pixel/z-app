import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const isOnline = useOfflineDetection();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-error text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg animate-pulse">
      <WifiOff size={20} />
      <span className="font-medium">You are offline - Showing cached data</span>
    </div>
  );
};

export default OfflineIndicator;
