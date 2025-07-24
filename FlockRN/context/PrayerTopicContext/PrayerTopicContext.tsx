import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  prayerTopicReducer,
  initialPrayerTopicState,
  PrayerTopicState,
} from './PrayerTopicReducer';
import {
  prayerTopicDispatch,
  PrayerTopicDispatch,
} from './PrayerTopicDispatch';
import { User } from 'firebase/auth';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

// Create the context
const PrayerTopicStateContext = createContext<PrayerTopicState | undefined>(
  undefined,
);

const PrayerTopicDispatchContext = createContext<
  PrayerTopicDispatch | undefined
>(undefined);

// Provider component
export const PrayerTopicContextProvider =
  (user: User) =>
  ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(
      prayerTopicReducer,
      initialPrayerTopicState(user),
    );
    const { userPrayerTopics } = usePrayerCollectionWithAuth();
    const wrappedDispatch = prayerTopicDispatch(
      dispatch,
      user,
      userPrayerTopics,
    );

    return (
      <PrayerTopicStateContext.Provider value={state}>
        <PrayerTopicDispatchContext.Provider value={wrappedDispatch}>
          {children}
        </PrayerTopicDispatchContext.Provider>
      </PrayerTopicStateContext.Provider>
    );
  };

// Custom hook to use the context
export const usePrayerTopicState = () => {
  const context = useContext(PrayerTopicStateContext);
  if (!context) {
    throw new Error(
      'usePrayerTopicState must be used within a PrayerTopicProvider',
    );
  }
  return context;
};

export const usePrayerTopicDispatch = () => {
  const context = useContext(PrayerTopicDispatchContext);
  if (!context) {
    throw new Error(
      'usePrayerTopicDispatch must be used within a PrayerTopicProvider',
    );
  }
  return context;
};
