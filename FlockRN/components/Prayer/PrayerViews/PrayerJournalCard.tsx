import { FC, useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Prayer } from '@shared/types/firebaseTypes';
import { getTimeString } from '@/utils/dateUtils';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '../../ui/IconSymbol';
import { TagLabel } from '../../ui/TagLabel';
import { getAuthorBadgeColorByInitial } from '@/constants/AuthorBadgeColors';

interface PrayerCardProps {
  prayer: Prayer;
  onPress?: (prayer: Prayer) => void;
  showContent?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
  maxLines?: number;
}

const PrayerJournalCard: FC<PrayerCardProps> = ({
  prayer,
  onPress,
  showContent = true,
  showDate = false,
  showAuthor = false,
  style,
  children,
  maxLines = 5,
}) => {
  const textColor = useThemeColor({}, 'textPrimary');
  const backgroundColor = useThemeColor({}, 'backgroundLight');

  const dateString = useMemo(() => {
    if (!showDate || !prayer.createdAt) return null;
    return getTimeString(prayer.createdAt);
  }, [showDate, prayer.createdAt]);

  const hasAudio = useMemo(() => {
    return !!prayer.audioLocalPath || !!prayer.audioRemotePath;
  }, [prayer.audioLocalPath, prayer.audioRemotePath]);

  const whoPrayed = useMemo(() => {
    if (!prayer.whoPrayed) return [];
    if (prayer.whoPrayed.length === 0) return [];

    return prayer.whoPrayed.map((person) => ({
      id: person.id,
      name: person.name,
    }));
  }, [prayer.whoPrayed]);

  return (
    <Pressable
      onPress={onPress ? () => onPress(prayer) : undefined}
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor + '80',
          borderColor: backgroundColor,
        },
        style,
      ]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.dateAndAudioContainer}>
          {(showDate || showAuthor) && (
            <ThemedText style={[styles.meta, { color: textColor }]}>
              {showDate && dateString && `Prayed at ${dateString}`}
            </ThemedText>
          )}
          {hasAudio && (
            <View
              style={[
                styles.audioIndicator,
                { backgroundColor: `${backgroundColor}80` },
              ]}
            >
              <IconSymbol
                name="mic.fill"
                size={12}
                color={textColor}
                weight="medium"
              />
            </View>
          )}
        </View>
      </View>

      {showContent && !!prayer.content && (
        <ThemedText
          style={[styles.content, { color: textColor }]}
          numberOfLines={maxLines}
        >
          {prayer.content}
        </ThemedText>
      )}

      {whoPrayed.length > 0 && (
        <View style={styles.authorContainer}>
          {whoPrayed.slice(0, 3).map((person) => (
            <TagLabel
              key={person.name}
              label={person.name}
              tagBackgroundColor={getAuthorBadgeColorByInitial(person.name)}
            />
          ))}
        </View>
      )}

      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    width: '100%',
  },
  dateAndAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meta: {
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  authorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  audioIndicator: {
    padding: 4,
    borderRadius: 6,
  },
});

export default PrayerJournalCard;
