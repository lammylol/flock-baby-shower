import { useState } from 'react';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { EditMode } from '@/types/ComponentProps';

interface UsePrayerPointSubmitHandlerProps {
  editMode: EditMode;
}

export function usePrayerPointSubmitHandler({
  editMode,
}: UsePrayerPointSubmitHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const submitPrayerPoint = async (
    point: PrayerPoint,
  ): Promise<{ success: boolean; updatedPoint?: PrayerPoint }> => {
    try {
      setIsLoading(true);

      const isCreate = editMode === 'create';
      const updatedPoint = isCreate
        ? await prayerPointService.createPrayerPoint(point)
        : await prayerPointService.updatePrayerPoint(point.id, point);

      return { success: true, updatedPoint };
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return { submitPrayerPoint, isLoading };
}
