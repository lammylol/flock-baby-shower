import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncPendingActions } from './syncWorker';
import { ReactNode } from 'react';
import * as React from 'react';

export function useNetworkSync() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPendingActions();
      }
    });
    return () => unsubscribe();
  }, []);
}

// NetworkSyncProvider component to handle network synchronization
export function NetworkSyncProvider({ children }: { children: ReactNode }) {
  useNetworkSync();

  return React.createElement(React.Fragment, null, children);
}
