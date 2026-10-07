import React, { useEffect, useState } from 'react';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 text-amber-300 px-4 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-md border border-amber-400/30 animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — Operating seamlessly from IndexedDB</span>
      <Database className="w-3.5 h-3.5 text-amber-400" />
    </div>
  );
};
