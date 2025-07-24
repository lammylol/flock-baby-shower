// PrayerPointSection.tsx
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { ThemedView } from '@/components/ThemedView';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import EditablePrayerCard from './PrayerCard';
import { UniqueAuthorBadges } from '@/components/ui/authorBadgeSection';
import { EditMode, From, FromProps } from '@/types/ComponentProps';
import Button from '@/components/Button';
import { NavigationUtils } from '@/utils/navigation';
import PrayerCreateModal from '@/app/modals/(prayerFlow)/prayerCreateModal';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';

interface PrayerPointProps {
  prayerPoints: PrayerPoint[];
  isPrayerCardsEditable?: boolean;
  onChange?: (prayerPoints: PrayerPoint[]) => void;
  editMode: EditMode;
  from: FromProps;
}

const PrayerPointSection: React.FC<PrayerPointProps> = ({
  prayerPoints,
  isPrayerCardsEditable = false,
  onChange,
  editMode = EditMode.VIEW,
  from,
}) => {
  const borderColor = useThemeColor(
    { dark: Colors.dark.backgroundSecondary },
    'borderPrimary',
  );
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);

  const handlePress = (prayerPoint: PrayerPoint) => {
    if (editMode !== EditMode.VIEW) {
      NavigationUtils.toCreatePrayerPointFromContent(
        {
          from: from.from,
          fromId: prayerPoint.id,
        },
        editMode,
      );
    } else {
      NavigationUtils.toPrayerPoint(prayerPoint.id, {
        from: from.from,
        fromId: prayerPoint.id,
      });
    }
  };

  // Filter out any undefined or null prayer points to prevent errors
  const validPrayerPoints = prayerPoints.filter(
    (point): point is PrayerPoint => point != null && point.id != null,
  );

  return (
    <ThemedView style={[styles.prayerPointsContainer, { borderColor }]}>
      <View style={styles.titleHeader}>
        <ThemedText style={styles.prayerPointsText}>Prayers Prayed</ThemedText>
        {from.from !== From.PRAYER && editMode !== EditMode.CREATE && (
          <Button
            label="+Add"
            textProps={{ ...styles.addButton }}
            size="s"
            onPress={() => {
              if (editMode === EditMode.VIEW) {
                setIsPrayerModalOpen(true);
              } else {
                NavigationUtils.toCreatePrayerModal({
                  from: from.from,
                  fromId: from.fromId,
                });
              }
            }}
          />
        )}
      </View>
      {validPrayerPoints.length > 0 ? (
        <ThemedView>
          <UniqueAuthorBadges journey={validPrayerPoints} />
          {validPrayerPoints.map((prayerPoint: PrayerPoint, index) => (
            <View key={prayerPoint.id} style={styles.innerContainer}>
              <EditablePrayerCard
                key={prayerPoint.id}
                prayer={prayerPoint}
                editable={isPrayerCardsEditable}
                onChange={(updatedPrayerPoint) => {
                  const updatedData = validPrayerPoints.map((point) =>
                    point.id === prayerPoint.id ? updatedPrayerPoint : point,
                  );
                  onChange?.(updatedData);
                }}
                maxLines={3}
                index={index}
                showDate={isPrayerCardsEditable ? false : true}
                showAuthor={isPrayerCardsEditable ? false : true}
                onPress={() => handlePress(prayerPoint)}
              />
            </View>
          ))}
        </ThemedView>
      ) : (
        <ContentUnavailable
          errorTitle="No Prayer Points"
          errorMessage="There are currently no prayer points available."
          textAlign="flex-start"
        />
      )}
      <PrayerCreateModal
        visible={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        from={{ from: from.from, fromId: from.fromId }}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    fontWeight: 'bold',
    textAlignVertical: 'center',
    paddingHorizontal: 4,
  },
  innerContainer: {
    gap: 10,
  },
  prayerPointsContainer: {
    borderRadius: 15,
    borderWidth: 1.5,
    gap: 8,
    padding: 16,
    width: '100%',
  },
  prayerPointsText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  titleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default PrayerPointSection;
