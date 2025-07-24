import * as syncWorker from '../hooks/zustand/syncSlice/syncWorker';
import { useSyncStore } from '../hooks/zustand/syncSlice/syncStore';

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn().mockResolvedValue({})),
}));
jest.mock('firebase/app', () => ({ getApp: jest.fn() }));

describe('syncPendingActions', () => {
  beforeEach(() => {
    useSyncStore.setState({
      pendingActions: [
        { id: '1', type: 'testFunction', payload: { foo: 'bar' } },
      ],
      isSyncing: false,
    });
  });

  it('removes action after successful sync', async () => {
    await syncWorker.syncPendingActions();
    expect(useSyncStore.getState().pendingActions).toHaveLength(0);
    expect(useSyncStore.getState().isSyncing).toBe(false);
  });

  it('does not sync if already syncing', async () => {
    useSyncStore.setState({ isSyncing: true });
    await syncWorker.syncPendingActions();
    // Should not remove the action
    expect(useSyncStore.getState().pendingActions).toHaveLength(1);
  });
});
