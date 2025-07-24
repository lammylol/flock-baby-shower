import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthorBadge } from '@/components/ui/authorBadge';
import { PrayerPointInTopicJourneyDTO } from '@shared/types/firebaseTypes';
import { colorPool } from '@/constants/TagColors';

interface UniqueAuthorBadgesProps {
  journey: PrayerPointInTopicJourneyDTO[];
}

export const UniqueAuthorBadges: React.FC<UniqueAuthorBadgesProps> = ({
  journey,
}) => {
  const uniqueAuthorsWithColor = useMemo(() => {
    const map = new Map();

    const getRandomColor = () =>
      colorPool[Math.floor(Math.random() * colorPool.length)];

    for (const j of journey) {
      const key = j.authorId ?? j.authorName;
      if (!map.has(key)) {
        map.set(key, { ...j, color: getRandomColor() });
      }
    }

    return [...map.values()];
  }, [journey]);

  const hasMultipleUniqueAuthors = useMemo(() => {
    return uniqueAuthorsWithColor.length > 1;
  }, [uniqueAuthorsWithColor]);

  if (!hasMultipleUniqueAuthors) return null;

  return (
    <View style={styles.authorsContainer}>
      {uniqueAuthorsWithColor.map((j, idx) => (
        <AuthorBadge
          key={j.authorId ?? idx}
          authorName={j.authorName}
          color={j.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  authorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
  },
});
