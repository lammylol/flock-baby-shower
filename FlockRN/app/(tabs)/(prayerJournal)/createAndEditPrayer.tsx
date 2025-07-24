import PrayerMetadata from '@/app/modals/(prayerFlow)/createPrayer';
import { PrayerMetadataContextProvider } from '@/context/PrayerMetadataContext/PrayerMetadataContext';
import { PrayerPointContextProvider } from '@/context/PrayerPointContext/PrayerPointContext';
import { useAuthenticatedUser } from '@/hooks/useAuthContext';

export default function CreateAndEditPrayerWithProvider() {
  const user = useAuthenticatedUser();

  const PrayerPointProvider = PrayerPointContextProvider(user);
  const PrayerProvider = PrayerMetadataContextProvider(user);

  return (
    <PrayerProvider>
      <PrayerPointProvider>
        <PrayerMetadata />
      </PrayerPointProvider>
    </PrayerProvider>
  );
}
