import { act } from '@testing-library/react-hooks';
import { useSyncStore } from '../hooks/zustand/syncSlice/syncStore';

describe('useSyncStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSyncStore.setState({ pendingActions: [], isSyncing: false });
  });

  it('adds a pending action', () => {
    act(() => {
      useSyncStore
        .getState()
        .addPendingAction({ id: '1', type: 'test', payload: { foo: 'bar' } });
    });
    expect(useSyncStore.getState().pendingActions).toHaveLength(1);
    expect(useSyncStore.getState().pendingActions[0].id).toBe('1');
  });

  it('removes a pending action', () => {
    act(() => {
      useSyncStore
        .getState()
        .addPendingAction({ id: '1', type: 'test', payload: {} });
      useSyncStore.getState().removeAction('1');
    });
    expect(useSyncStore.getState().pendingActions).toHaveLength(0);
  });

  it('sets isSyncing', () => {
    act(() => {
      useSyncStore.getState().setIsSyncing(true);
    });
    expect(useSyncStore.getState().isSyncing).toBe(true);
  });
});
