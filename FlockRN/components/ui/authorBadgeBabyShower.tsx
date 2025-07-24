import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthorBadge } from '@/components/ui/authorBadge';
import { Prayer } from '@shared/types/firebaseTypes';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface UniqueAuthorBadgesBabyShowerProps {
  prayers: Prayer[];
}

export const UniqueAuthorBadgesBabyShower: React.FC<
  UniqueAuthorBadgesBabyShowerProps
> = ({ prayers }) => {
  const uniqueAuthors = useMemo(() => {
    const uniqueNames: string[] = [];

    for (const prayer of prayers) {
      for (const person of prayer.whoPrayed ?? []) {
        if (!uniqueNames.includes(person.name) && person) {
          uniqueNames.push(person.name);
        }
      }
    }

    return uniqueNames;
  }, [prayers]);

  const hasUniqueAuthors = useMemo(() => {
    return uniqueAuthors.length > 0;
  }, [uniqueAuthors]);

  // Show max 7 badges, rest in indicator
  const visibleBadges = uniqueAuthors.slice(0, 5);
  const hiddenCount = Math.max(0, uniqueAuthors.length - 5);

  const textColor = useThemeColor({}, 'backgroundCream');

  if (!hasUniqueAuthors) return null;

  return (
    <View style={styles.authorsContainer}>
      {visibleBadges.map((author: string) => (
        <AuthorBadge
          key={author}
          authorName={author}
          size={32}
          textStyle={styles.badge}
        />
      ))}
      {hiddenCount > 0 && (
        <View style={styles.moreIndicator}>
          <ThemedText style={[styles.moreText, { color: textColor }]}>
            +{hiddenCount} more
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  authorsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  badge: {
    fontSize: 14,
    fontWeight: '500',
  },
  moreIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  moreText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
