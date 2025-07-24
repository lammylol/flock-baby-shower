import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { EditMode, Tag } from '@/types/ComponentProps';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { TagInput } from '@/components/ui/ThemedTagTextField';
import { Recipient } from '@shared/types/firebaseTypes';
import { useMemo } from 'react';
import { TagLabel } from '@/components/ui/TagLabel';
import { getAuthorBadgeColorByInitial } from '@/constants/AuthorBadgeColors';

type WhoPrayedSectionProps = {
  whoPrayed: Recipient[];
  editMode: EditMode;
  onChange?: (recipients: Recipient[]) => void;
};

const WhoPrayedSection = ({
  whoPrayed,
  editMode,
  onChange,
}: WhoPrayedSectionProps) => {
  const borderColor = useThemeColor(
    { dark: Colors.dark.backgroundSecondary },
    'borderPrimary',
  );
  const textColor = useThemeColor({}, 'textPrimary');
  const whoPrayedTags = useMemo(() => {
    return whoPrayed
      .filter((person) => person.name !== 'User')
      .map((person) => ({
        name: person.name,
        id: person.id,
      })) as Tag[];
  }, [whoPrayed]);

  return editMode !== EditMode.VIEW ? (
    <ThemedView style={[styles.container, { borderColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Let Elia (Ellie) know who prayed...
        </ThemedText>
      </View>

      <View style={styles.body}>
        <TagInput
          value={whoPrayedTags}
          tagPlaceholder="Enter your name(s)"
          onTagChange={(updatedTags) => {
            onChange?.(updatedTags as Recipient[]);
          }}
        />
      </View>
    </ThemedView>
  ) : (
    <ThemedView style={styles.viewModeContainer}>
      <ThemedText style={[styles.viewModeText, { color: textColor }]}>
        Prayed by:
      </ThemedText>
      {whoPrayed.map((person) => {
        return (
          <TagLabel
            key={person.name}
            label={person.name}
            tagBackgroundColor={getAuthorBadgeColorByInitial(person.name)}
          />
        );
      })}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    marginTop: 12,
  },
  viewModeContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 16,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
});

export default WhoPrayedSection;
