import PrayerTopicEditor from '@/components/Prayer/PrayerEdit/PrayerTopicEditor';
import { PrayerTopicContextProvider } from '@/context/PrayerTopicContext/PrayerTopicContext';
import useAuthContext from '@/hooks/useAuthContext';
import { EditMode } from '@/types/ComponentProps';
import { User } from 'firebase/auth';
import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function CreateAndEditPrayerTopicWithProvider() {
  const params = useLocalSearchParams<{
    from?: string;
    fromId?: string;
    editMode?: EditMode;
  }>();

  const processedParams = useMemo(() => {
    const p = {
      fromId: params.fromId ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
    };

    return p;
  }, [params.editMode, params.fromId]);

  const { fromId, editMode } = processedParams;

  const { user } = useAuthContext();
  const PrayerTopicProvider = PrayerTopicContextProvider(user as User);

  return (
    <PrayerTopicProvider>
      <PrayerTopicEditor id={fromId} editMode={editMode} />
    </PrayerTopicProvider>
  );
}
