import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Prayer } from '@shared/types/firebaseTypes';
import { router } from 'expo-router';
import PrayerJournalCard from './PrayerJournalCard';

type Props = {
  prayers: Prayer[];
};

export default function PrayerDayGroup({ prayers }: Props) {
  const handlePress = (prayer: Prayer) => {
    router.push({
      pathname: '/(tabs)/(prayerJournal)/prayerView',
      params: { id: prayer.id },
    });
  };

  return (
    <View style={styles.groupContainer}>
      {prayers.map((prayer) => (
        <ThemedView key={prayer.id} style={styles.cardContainer}>
          <PrayerJournalCard
            prayer={prayer}
            showDate
            showAuthor
            onPress={handlePress}
            maxLines={5}
          />
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: 'column',
    marginBottom: 24,
    gap: 8,
  },
  cardContainer: {
    // borderWidth: 1,
    borderRadius: 12,
  },
});
