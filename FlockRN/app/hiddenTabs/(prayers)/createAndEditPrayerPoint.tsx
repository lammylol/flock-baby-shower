import PrayerPointMetadata from '@/app/modals/(prayerFlow)/createPrayerPointFromContent';
import { PrayerMetadataContextProvider } from '@/context/PrayerMetadataContext/PrayerMetadataContext';
import { PrayerPointContextProvider } from '@/context/PrayerPointContext/PrayerPointContext';
import useAuthContext from '@/hooks/useAuthContext';
import { User } from 'firebase/auth';

export default function CreateAndEditPrayerPointWithProvider() {
  const { user } = useAuthContext();

  const PrayerPointProvider = PrayerPointContextProvider(user as User);
  const PrayerProvider = PrayerMetadataContextProvider(user as User);

  return (
    <PrayerProvider>
      <PrayerPointProvider>
        <PrayerPointMetadata />
      </PrayerPointProvider>
    </PrayerProvider>
  );
}
