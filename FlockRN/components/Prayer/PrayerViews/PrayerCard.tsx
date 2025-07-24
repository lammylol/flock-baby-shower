import { ThemedText } from '@/components/ThemedText';
import {
  AnyPrayerEntity,
  PartialLinkedPrayerEntity,
  PrayerPoint,
} from '@shared/types/firebaseTypes';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { useMemo } from 'react';
import { getEntityType } from '@/types/typeGuards';
import {
  getPrayerCardHeaderInfo,
  getPrayerType,
} from '@/utils/UI/prayerCardUtils';
import { From } from '@/types/ComponentProps';
import { PrayerCardHeader } from '@/components/ui/PrayerCardHeader';
import { getDateStringWithTime } from '@/utils/dateUtils';
import { NavigationUtils } from '@/utils/navigation';

interface EditablePrayerCardProps {
  prayer: AnyPrayerEntity;
  editable?: boolean;
  onChange?: (updated: PrayerPoint) => void;
  onPress?: (prayer: AnyPrayerEntity) => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
  showContent?: boolean;
  maxLines?: number;
  index?: number; // for use when selecting a prayer point w/o id.
  showDate?: boolean;
  showAuthor?: boolean;
}

const EditablePrayerCard: React.FC<EditablePrayerCardProps> = ({
  prayer,
  editable,
  onChange,
  onPress,
  isDisabled,
  children,
  showContent = true,
  maxLines,
  showDate = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const maxLinesValue = maxLines ?? 1;
  const isEditMode = false; // temporarily set to false until we update prayer cards.

  const { prayerType, entityType } = useMemo(
    () => ({
      prayerType: getPrayerType(prayer) ?? PrayerType.Request,
      entityType: getEntityType(prayer) ?? EntityType.Prayer,
    }),
    [prayer],
  );

  const isPrayer = entityType === EntityType.Prayer;

  const triggerChange = (partial: PartialLinkedPrayerEntity) => {
    if (!onChange) return;
    onChange({ ...prayer, ...partial } as PrayerPoint);
  };

  const handleTitleChange = (text: string) => {
    triggerChange({ title: text });
  };

  const handleEdit = () => {
    NavigationUtils.toEditPrayerPoint({
      from: From.PRAYER_POINT,
      fromId: prayer.id,
    });
  };

  const { title, subtitle, iconType } = getPrayerCardHeaderInfo(
    entityType,
    prayer,
    prayerType,
  );

  const content = useMemo(() => {
    if (showContent && prayer.entityType === EntityType.PrayerPoint) {
      return prayer.content;
    } else if (showContent && prayer.entityType === EntityType.PrayerTopic) {
      return null;
    }
    return prayer.content;
  }, [showContent, prayer]);

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={!isDisabled ? () => onPress?.(prayer) : undefined}
    >
      {showDate && !!prayer.createdAt && (
        <ThemedText style={styles.createdAtText}>
          {`${getDateStringWithTime(prayer.createdAt)} • ${prayer.authorName}`}
        </ThemedText>
      )}
      {!isPrayer && (
        <PrayerCardHeader
          title={title}
          subtitle={subtitle}
          iconType={iconType as PrayerType}
          entityType={entityType}
          editable={editable}
          isEditMode={isEditMode}
          // onDelete={onDelete}
          onEditPress={handleEdit}
          onTitleChange={handleTitleChange}
        />
      )}
      {showContent && !!content && (
        <ThemedText style={styles.contentText} numberOfLines={maxLinesValue}>
          {content}
        </ThemedText>
      )}
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingVertical: 10,
    gap: 10,
    width: '100%',
    alignSelf: 'stretch',
    verticalAlign: 'middle',
  },
  createdAtText: {
    fontSize: 14,
    fontWeight: '300',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default EditablePrayerCard;
