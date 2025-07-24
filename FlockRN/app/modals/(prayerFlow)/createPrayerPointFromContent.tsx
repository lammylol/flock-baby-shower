import PrayerPointEditor from '@/components/Prayer/PrayerEdit/PrayerPointEditor';
import { EditMode, From } from '@/types/ComponentProps';
import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

const PrayerPointMetadata = () => {
  const params = useLocalSearchParams<{
    editMode?: EditMode;
    from: From;
    fromId: string;
  }>();

  const processedParams = useMemo(() => {
    const p = {
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
      from: (params.from as From) ?? From.PRAYER,
      fromId: params.fromId ?? '',
    };

    return p;
  }, [params.editMode, params.from, params.fromId]);

  const { editMode, from, fromId } = processedParams;

  return (
    <PrayerPointEditor
      editMode={editMode}
      from={{ from: from, fromId: fromId }}
    />
  );
};

export default PrayerPointMetadata;
