import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import {
  AnyPrayerEntity,
  LinkedPrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import { EditMode } from '@/types/ComponentProps';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { JSX, useRef } from 'react';
import { isPrayerTopic } from '@/types/typeGuards';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getDateStringWithTime, simplifiedDateString } from '@/utils/dateUtils';

export function PrayerContent({
  editMode,
  entityType,
  prayer,
  onChange, // Callback for changes
}: {
  editMode: EditMode;
  backgroundColor?: string;
  entityType: EntityType;
  prayer?: AnyPrayerEntity; // only required for edit and view modes
  onChange?: (updatedPrayer: PrayerPoint | Prayer | PrayerTopic) => void;
}): JSX.Element {
  const recipientColor = useThemeColor({}, 'textSecondary');
  const contentInputRef = useRef<TextInput>(null);
  const background = useThemeColor({}, 'backgroundLight');
  const textColor = useThemeColor({}, 'textPrimary');
  // Initialize state with provided values or from the selected prayer
  const handleTitleChange = (text: string) => {
    triggerChange({ title: text });
  };

  const handleContentChange = (text: string) => {
    triggerChange({ content: text });
  };

  const handleTagsChange = (tags: PrayerType[]) => {
    triggerChange({
      tags: tags,
      prayerType: tags[0] || PrayerType.Request,
    });
  };

  const triggerChange = (partial: Partial<Prayer | PrayerPoint>) => {
    if (!onChange) return;

    const updatedPrayer = {
      ...(prayer || {}),
      ...partial,
    };

    onChange(
      entityType === 'prayer'
        ? (updatedPrayer as Prayer)
        : (updatedPrayer as PrayerPoint),
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {editMode === EditMode.VIEW &&
        isPrayerTopic(prayer) &&
        prayer.recipients?.[0]?.name !== 'User' &&
        prayer.recipients?.[0]?.name !== undefined && (
          <ThemedText style={[styles.recipientText, { color: recipientColor }]}>
            {`Praying for: ${prayer?.recipients?.map((recipient) => recipient.name).join(', ')}`}
          </ThemedText>
        )}
      {(editMode === EditMode.EDIT || editMode === EditMode.CREATE) &&
      entityType != EntityType.Prayer ? (
        <ThemedTextInput
          style={[styles.titleText, styles.input]}
          value={(prayer as LinkedPrayerEntity)?.title}
          onChangeText={handleTitleChange}
          multiline
          maxLength={100}
          placeholder="Add a Title..."
          scrollEnabled={false}
          autoFocus
          autoCorrect={true}
          autoComplete="off"
          autoCapitalize="words"
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={() => contentInputRef?.current?.focus?.()}
          submitBehavior="submit"
        />
      ) : entityType != EntityType.Prayer ? (
        <ThemedText style={[styles.titleText, { color: textColor }]}>
          {(prayer as PrayerPoint).title}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.titleText, { color: textColor }]}>
          {`Prayed on ${simplifiedDateString(
            getDateStringWithTime(prayer?.createdAt) || '',
          )}`}
        </ThemedText>
      )}
      {editMode === EditMode.EDIT || editMode === EditMode.CREATE ? (
        <ThemedTextInput
          style={[styles.contentText, styles.input]}
          value={prayer?.content}
          onChangeText={handleContentChange}
          multiline
          placeholder={
            entityType === EntityType.PrayerTopic
              ? 'Details...'
              : 'Enter your prayer point here...'
          }
          scrollEnabled={false}
          autoCorrect={true}
          autoComplete="off"
          autoCapitalize="sentences"
          keyboardType="default"
          returnKeyType="default"
          ref={contentInputRef}
        />
      ) : (
        <ThemedText style={styles.contentText}>{prayer?.content}</ThemedText>
      )}
      {entityType != EntityType.Prayer && prayer && 'prayerType' in prayer && (
        <TagsSection
          tags={
            !prayer.tags || prayer.tags.length === 0
              ? [prayer.prayerType]
              : prayer.tags || [PrayerType.Request]
          } // this is a workaround for the issue where prayerType is not set
          onChange={handleTagsChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentText: {
    fontSize: 16,
    flexGrow: 1,
    lineHeight: 24,
  },
  input: {
    padding: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  recipientText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
  },
});

export default PrayerContent;
