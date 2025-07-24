// scripts/fixSyncActions.ts
// Run this script to fix pending sync actions with incorrect function names

import AsyncStorage from '@react-native-async-storage/async-storage';

type DeletePrayerPointAction = {
  id: string;
  type: 'deletePrayerPoint';
  payload: string; // the entityId
};

type SubmitPrayerPointAction = {
  id: string;
  type: 'submitPrayerPoint';
  payload: unknown; // Define more specific type if available
};

type DeleteEntityAction = {
  id: string;
  type: 'deleteEntity';
  payload: {
    entityType: 'prayerPoint';
    entityId: string;
  };
};

type SubmitPrayerPointWithLinkAction = {
  id: string;
  type: 'submitPrayerPointWithLink';
  payload: unknown;
};

type KnownSyncAction =
  | DeletePrayerPointAction
  | SubmitPrayerPointAction
  | DeleteEntityAction
  | SubmitPrayerPointWithLinkAction;

interface SyncStoreData {
  state?: {
    pendingActions?: KnownSyncAction[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

async function fixSyncActions(): Promise<void> {
  console.log('🔧 Starting sync actions fix script...');

  try {
    const syncStorageKey = 'sync-storage';
    const storedData = await AsyncStorage.getItem(syncStorageKey);

    if (!storedData) {
      console.log('📊 No sync storage found');
      return;
    }

    const parsedData: SyncStoreData = JSON.parse(storedData);
    const pendingActions = parsedData.state?.pendingActions ?? [];

    console.log('📊 Current state before fix:', {
      pendingActionsCount: pendingActions.length,
      pendingActions,
    });

    const fixedActions = pendingActions.map((action): KnownSyncAction => {
      switch (action.type) {
        case 'deletePrayerPoint':
          const deleteAction: DeleteEntityAction = {
            id: action.id,
            type: 'deleteEntity',
            payload: {
              entityType: 'prayerPoint',
              entityId: action.payload,
            },
          };
          console.log(
            '🔧 Fixed deletePrayerPoint -> deleteEntity:',
            deleteAction,
          );
          return deleteAction;

        case 'submitPrayerPoint':
          const submitAction: SubmitPrayerPointWithLinkAction = {
            id: action.id,
            type: 'submitPrayerPointWithLink',
            payload: action.payload,
          };
          console.log(
            '🔧 Fixed submitPrayerPoint -> submitPrayerPointWithLink:',
            submitAction,
          );
          return submitAction;

        default:
          return action;
      }
    });

    const updatedData: SyncStoreData = {
      ...parsedData,
      state: {
        ...parsedData.state,
        pendingActions: fixedActions,
      },
    };

    await AsyncStorage.setItem(syncStorageKey, JSON.stringify(updatedData));

    console.log('📊 State after fix:', {
      pendingActionsCount: fixedActions.length,
      pendingActions: fixedActions,
    });

    console.log('✅ Fix script completed!');
    console.log('💡 Restart your app to see the changes take effect.');
  } catch (error) {
    console.error('❌ Error fixing sync actions:', error);
  }
}

fixSyncActions();
