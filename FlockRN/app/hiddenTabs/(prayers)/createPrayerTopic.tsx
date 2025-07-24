import PrayerTopicEditor from '@/components/Prayer/PrayerEdit/PrayerTopicEditor';
import { EditMode } from '@/types/ComponentProps';
import { PrayerTopicContextProvider } from '@/context/PrayerTopicContext/PrayerTopicContext';
import { User } from 'firebase/auth';
import useAuthContext from '@/hooks/useAuthContext';
import { useMemo } from 'react';

type PrayerTopicProps = {
  visible: boolean;
  fromId?: string;
  editMode?: EditMode;
};

const PrayerTopicMetadataStandaloneScreen = ({
  fromId = '',
  editMode = EditMode.CREATE,
}: PrayerTopicProps) => {
  const { user } = useAuthContext();

  // Memoize the provider to prevent recreation on every render
  const PrayerTopicProvider = useMemo(() => {
    if (!user) return null;
    return PrayerTopicContextProvider(user as User);
  }, [user]);

  // Don't render if user is not available
  if (!PrayerTopicProvider) {
    return null;
  }

  return (
    <PrayerTopicProvider>
      <PrayerTopicEditor id={fromId} editMode={editMode} />
    </PrayerTopicProvider>
  );
};

export default PrayerTopicMetadataStandaloneScreen;
