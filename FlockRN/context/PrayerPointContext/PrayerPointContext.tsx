import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import {
  initialPrayerPointState,
  prayerPointReducer,
  PrayerPointState,
} from './PrayerPointReducer';
import { prayerPointDispatch } from './PrayerPointDispatch';
import { User } from 'firebase/auth';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

const PrayerPointStateContext = createContext<PrayerPointState | undefined>(
  undefined,
);
const PrayerPointDispatchContext = createContext<
  ReturnType<typeof prayerPointDispatch> | undefined
>(undefined);
export const PrayerPointContextProvider =
  (user: User) =>
  ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(
      prayerPointReducer,
      initialPrayerPointState(user),
    );
    const { userPrayerPoints } = usePrayerCollectionWithAuth();
    const wrappedDispatch = prayerPointDispatch(
      dispatch,
      user,
      userPrayerPoints,
    );

    return (
      <PrayerPointStateContext.Provider value={state}>
        <PrayerPointDispatchContext.Provider value={wrappedDispatch}>
          {children}
        </PrayerPointDispatchContext.Provider>
      </PrayerPointStateContext.Provider>
    );
  };

export const usePrayerPointState = () => {
  const context = useContext(PrayerPointStateContext);
  if (!context) {
    throw new Error(
      'usePrayerPointContext must be used within a PrayerPointProvider',
    );
  }
  return context;
};

export const usePrayerPointDispatch = () => {
  const context = useContext(PrayerPointDispatchContext);
  if (!context) {
    throw new Error(
      'usePrayerPointDispatch must be used within a PrayerPointProvider',
    );
  }
  return context;
};
