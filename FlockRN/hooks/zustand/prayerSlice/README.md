# Prayer Store Migration Guide

## Overview

The `PrayerCollectionContext` has been migrated to use Zustand's `prayerStore` for better state management, persistence, and performance. This migration provides:

- **Better Performance**: Zustand is more efficient than React Context for frequent updates
- **Persistence**: Automatic data persistence using AsyncStorage
- **Simpler State Management**: No need for complex context providers
- **Better Developer Experience**: Built-in devtools and easier debugging

## Migration Status

✅ **Complete**: The migration is complete and backward compatible.
✅ **Provider Removed**: The `PrayerCollectionProvider` has been removed from the app layout
✅ **Automatic Data Loading**: Data is now automatically initialized via `DataInitializer`
✅ **Backward Compatibility**: Existing code using `usePrayerCollectionWithAuth()` continues to work without changes

## What Changed

### Before (PrayerCollectionContext with Provider)

```typescript
// App Layout
<PrayerCollectionProvider>
  <AppContent />
</PrayerCollectionProvider>

// Component Usage
import { usePrayerCollectionWithAuth } from '@/context/PrayerCollectionContext';

const { userPrayers, loadPrayers, searchPrayers } = usePrayerCollectionWithAuth();
```

### After (Store-Based with Automatic Loading)

```typescript
// App Layout (no provider needed)
<DataInitializer />
<AppContent />

// Component Usage (same interface)
import { usePrayerCollectionWithAuth } from '@/context/PrayerCollectionContext';

const { userPrayers, loadPrayers, searchPrayers } = usePrayerCollectionWithAuth();
```

### After (Direct Store Usage - Recommended)

```typescript
import { usePrayerStore } from '@/hooks/zustand/prayerSlice/prayerStore';
import useAuthContext from '@/hooks/useAuthContext';

const { user } = useAuthContext();
const { prayers, loadPrayers, searchPrayers } = usePrayerStore();

// Load data with userId
useEffect(() => {
  if (user?.uid) {
    loadPrayers(user.uid);
  }
}, [user?.uid]);
```

### After (Compatibility Hook - Still Works)

```typescript
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

const { userPrayers, loadPrayers, searchPrayers } =
  usePrayerCollectionWithAuth();
```

## Available Hooks

### 1. `usePrayerStore()` - Direct Store Access

Access the store directly with full control over when to load data.

```typescript
const {
  // Data
  prayers,
  prayerPoints,
  topics,
  filteredPrayers,
  filteredPrayerPoints,
  filteredPrayerTopics,

  // Actions
  loadAll,
  loadPrayers,
  loadPrayerPoints,
  loadPrayerTopics,
  searchPrayers,
  updateCollection,
  removeFromCollection,

  // Legacy actions (still available)
  addPrayer,
  updatePrayer,
  removePrayer,
  addPrayerPoint,
  updatePrayerPoint,
  removePrayerPoint,
  addTopic,
  updateTopic,
  setTopics,
} = usePrayerStore();
```

### 2. `usePrayerCollectionWithAuth()` - Auth-Integrated Hook

Automatically integrates with auth context for seamless data loading.

```typescript
const {
  userPrayers,
  userPrayerPoints,
  userPrayerTopics,
  filteredUserPrayers,
  filteredUserPrayerPoints,
  filteredUserPrayerTopics,
  userPPandTopicsWithContextEmbeddings,
  loadAll,
  loadPrayers,
  loadPrayerPoints,
  loadPrayerTopics,
  searchPrayers,
  updateCollection,
  removeFromCollection,
} = usePrayerCollectionWithAuth();
```

### 3. `useUserPPandTopicsWithContextEmbeddings()` - Computed Selector

Get prayer points and topics with context embeddings.

```typescript
const entitiesWithEmbeddings = useUserPPandTopicsWithContextEmbeddings();
```

## Migration Steps

### Step 1: No Action Required (Immediate)

Existing code continues to work without any changes:

```typescript
// This still works exactly the same
import { usePrayerCollectionWithAuth } from '@/context/PrayerCollectionContext';

const { userPrayers, loadPrayers, searchPrayers } =
  usePrayerCollectionWithAuth();
```

### Step 2: Update Imports (Optional - Recommended)

If you want to use the store directly:

```typescript
// Old
import { usePrayerCollectionWithAuth } from '@/context/PrayerCollectionContext';

// New
import { usePrayerStore } from '@/hooks/zustand/prayerSlice/prayerStore';
```

### Step 3: Update Data Loading (Required for Direct Store Usage)

If using `usePrayerStore()` directly, you need to handle user authentication:

```typescript
import { usePrayerStore } from '@/hooks/zustand/prayerSlice/prayerStore';
import useAuthContext from '@/hooks/useAuthContext';
import { useEffect } from 'react';

const { user } = useAuthContext();
const { loadPrayers, prayers } = usePrayerStore();

useEffect(() => {
  if (user?.uid) {
    loadPrayers(user.uid);
  }
}, [user?.uid]);
```

### Step 4: Update Property Names (If Using Direct Store)

The store uses slightly different property names:

```typescript
// Old (Context)
const { userPrayers, userPrayerPoints, userPrayerTopics } =
  usePrayerCollectionWithAuth();

// New (Direct Store)
const { prayers, prayerPoints, topics } = usePrayerStore();

// Or use compatibility hook to keep old names
const { userPrayers, userPrayerPoints, userPrayerTopics } =
  usePrayerCollectionWithAuth();
```

## Benefits of the New Store

1. **Automatic Persistence**: Data is automatically saved to AsyncStorage
2. **Better Performance**: Zustand is more efficient than React Context
3. **DevTools Support**: Built-in Redux DevTools integration
4. **Simpler Testing**: Easier to mock and test
5. **No Provider Required**: No need to wrap components in providers
6. **Type Safety**: Full TypeScript support
7. **Automatic Data Loading**: Data loads automatically when user is authenticated

## Backward Compatibility

The migration maintains full backward compatibility:

- ✅ `usePrayerCollectionWithAuth()` still works (uses compatibility hook)
- ✅ All existing property names are preserved
- ✅ All existing function signatures are preserved
- ✅ No breaking changes to existing code
- ✅ No provider required in app layout

## Future Recommendations

1. **Gradually migrate** to using `usePrayerStore()` directly for better performance
2. **Use the auth-integrated hook** (`usePrayerCollectionWithAuth()`) for new components
3. **Consider removing** the context provider once all components are migrated
4. **Leverage persistence** for offline functionality

## Troubleshooting

### Data Not Loading

Make sure you're passing the `userId` when using the direct store:

```typescript
// ❌ Wrong
loadPrayers();

// ✅ Correct
loadPrayers(user.uid);
```

### TypeScript Errors

If you encounter TypeScript errors, make sure you're using the correct property names:

```typescript
// ❌ Old context names with direct store
const { userPrayers } = usePrayerStore();

// ✅ Correct direct store names
const { prayers } = usePrayerStore();

// ✅ Or use compatibility hook
const { userPrayers } = usePrayerCollectionWithAuth();
```

## Migration Checklist

### Phase 1: Immediate (No Action Required)

- [x] Remove `PrayerCollectionProvider` from app layout
- [x] Add `DataInitializer` for automatic data loading
- [x] Ensure backward compatibility

### Phase 2: Gradual Migration (Recommended)

- [ ] Update imports to use `usePrayerCollectionWithAuth()`
- [ ] Test components work correctly
- [ ] Remove any manual data loading calls (data loads automatically)

### Phase 3: Performance Optimization (Optional)

- [ ] Migrate to direct store usage (`usePrayerStore()`)
- [ ] Update property names
- [ ] Add manual data loading where needed
