// PrayerCreationContext.tsx
import { createContext, useContext, ReactNode, useReducer } from 'react';
import {
  prayerMetadataReducer,
  initialState,
  PrayerMetadataState,
} from '@/context/PrayerMetadataContext/PrayerMetadataReducer';
import {
  PrayerMetadataDispatch,
  prayerMetadataDispatch,
} from '@/context/PrayerMetadataContext/PrayerMetadataDispatch';
import { User } from 'firebase/auth';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

const PrayerMetadataStateContext = createContext<
  PrayerMetadataState | undefined
>(undefined);
const PrayerMetadataDispatchContext = createContext<
  PrayerMetadataDispatch | undefined
>(undefined);

export const PrayerMetadataContextProvider =
  (user: User) =>
  ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(
      prayerMetadataReducer,
      initialState(user),
    );

    // Call the hook at the top level
    const { userPrayers, userPrayerPoints } = usePrayerCollectionWithAuth();

    const wrappedDispatch = prayerMetadataDispatch(
      dispatch,
      user,
      userPrayers,
      userPrayerPoints,
    );

    return (
      <PrayerMetadataStateContext.Provider value={state}>
        <PrayerMetadataDispatchContext.Provider value={wrappedDispatch}>
          {children}
        </PrayerMetadataDispatchContext.Provider>
      </PrayerMetadataStateContext.Provider>
    );
  };

// State hook
export const usePrayerMetadataState = () => {
  const context = useContext(PrayerMetadataStateContext);
  if (context === undefined) {
    throw new Error(
      'usePrayerMetadataState must be used within a PrayerMetadataProvider',
    );
  }
  return context;
};

// Dispatch hook
export const usePrayerMetadataDispatch = () => {
  const context = useContext(PrayerMetadataDispatchContext);
  if (context === undefined) {
    throw new Error(
      'usePrayerMetadataDispatch must be used within a PrayerMetadataProvider',
    );
  }
  return context;
};
