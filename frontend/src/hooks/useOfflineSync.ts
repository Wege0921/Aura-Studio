import { useState, useEffect } from 'react';

interface OfflineAction {
  id: string;
  type: 'booking' | 'payment' | 'user_update';
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from localStorage
    const stored = localStorage.getItem('offlineActions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineAction = (type: OfflineAction['type'], data: any) => {
    const action: OfflineAction = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    const updatedActions = [...pendingActions, action];
    setPendingActions(updatedActions);
    localStorage.setItem('offlineActions', JSON.stringify(updatedActions));
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    setIsSyncing(true);
    const token = localStorage.getItem('token');

    try {
      const updatedActions = [...pendingActions];
      const successfulActions: string[] = [];

      for (const action of updatedActions) {
        try {
          let response;
          
          switch (action.type) {
            case 'booking':
              response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(action.data)
              });
              break;

            case 'payment':
              response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(action.data)
              });
              break;

            case 'user_update':
              response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(action.data)
              });
              break;
          }

          if (response.ok) {
            successfulActions.push(action.id);
          } else {
            // Increment retry count
            action.retryCount++;
            
            // Remove if max retries reached
            if (action.retryCount >= 3) {
              successfulActions.push(action.id);
              console.error(`Failed to sync action ${action.id} after 3 retries`);
            }
          }
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error);
          action.retryCount++;
          
          if (action.retryCount >= 3) {
            successfulActions.push(action.id);
          }
        }
      }

      // Remove successful or max-retry actions
      const remainingActions = updatedActions.filter(
        action => !successfulActions.includes(action.id)
      );

      setPendingActions(remainingActions);
      localStorage.setItem('offlineActions', JSON.stringify(remainingActions));
    } finally {
      setIsSyncing(false);
    }
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem('offlineActions');
  };

  return {
    isOnline,
    isSyncing,
    pendingActions,
    saveOfflineAction,
    syncPendingActions,
    clearPendingActions
  };
};
