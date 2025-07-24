// hooks/usePrayerPointHandler.ts
import { useCallback, useState } from 'react';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';
import {
  CreatePrayerDTO,
  Prayer,
  UpdatePrayerDTO,
} from '@shared/types/firebaseTypes';
import { EntityType, Privacy } from '@/types/PrayerSubtypes';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { Timestamp } from 'firebase/firestore';

export interface UsePrayerHandlerProps {
  id: string;
  content?: string;
  privacy?: Privacy;
}
export function usePrayerHandler({
  id,
  content,
  privacy = 'private',
}: UsePrayerHandlerProps) {
  const { userPrayers, updateCollection } = usePrayerCollectionWithAuth();
  const user = auth.currentUser;

  const [updatedPrayer, setUpdatedPrayer] = useState<Prayer>({
    id: id || '',
    content: content || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    authorName: 'unknown',
    authorId: 'unknown',
    privacy: 'private',
    prayerPoints: [],
    entityType: EntityType.Prayer,
  });

  const handlePrayerUpdate = (data: Partial<Prayer>) => {
    const newUpdated = { ...updatedPrayer, ...data };
    setUpdatedPrayer(newUpdated);
  };

  const loadPrayer = useCallback(async () => {
    const contextPrayer = userPrayers.find((p) => p.id === id);
    if (contextPrayer) {
      setUpdatedPrayer({ ...contextPrayer });
      return;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayer(id);
      if (fetchedPrayer) {
        setUpdatedPrayer({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
    }
  }, [id, userPrayers]);

  // requires parameter to be passed in to avoid possible useState delay.
  const createPrayer = async (data: Prayer): Promise<Prayer> => {
    if (!user?.uid) throw new Error('User not authenticated');

    const prayerData: CreatePrayerDTO = {
      content: data.content,
      privacy: data.privacy,
      authorId: auth.currentUser!.uid,
      authorName: auth.currentUser!.displayName ?? 'Unknown',
    };

    const prayer = await prayerService.createPrayer(prayerData);
    console.log('Success', 'Prayer created successfully.');
    return prayer;
  };

  // requires parameter to be passed in to avoid possible useState delay.
  const updatePrayer = async (data: Prayer) => {
    const updateData: UpdatePrayerDTO = {
      content: data.content,
      privacy: privacy,
    };
    await prayerService.updatePrayer(data.id, updateData);

    updateCollection({ ...updatedPrayer, ...updateData } as Prayer, 'prayer');
    console.log('Success', 'Prayer updated successfully');
  };

  return {
    updatedPrayer,
    setUpdatedPrayer,
    handlePrayerUpdate,
    createPrayer,
    updatePrayer,
    loadPrayer,
  };
}
