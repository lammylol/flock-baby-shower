import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { EditMode, Tag } from '@/types/ComponentProps';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { TagInput } from '@/components/ui/ThemedTagTextField';
import { Recipient } from '@shared/types/firebaseTypes';
import { useMemo } from 'react';

type PrayerRecipientSectionProps = {
  recipients: Recipient[];
  editMode: EditMode;
  onRecipientChange?: (recipients: Recipient[]) => void;
};

const PrayerRecipientSection = ({
  recipients,
  editMode,
  onRecipientChange,
}: PrayerRecipientSectionProps) => {
  const borderColor = useThemeColor(
    { dark: Colors.dark.backgroundSecondary },
    'borderPrimary',
  );
  const textColor = useThemeColor({}, 'textPrimary');
  const placeholderColor = useThemeColor({}, 'textSecondary');
  const recipientTags = useMemo(() => {
    return recipients
      .filter((recipient) => recipient.name !== 'User')
      .map((recipient) => ({
        name: recipient.name,
        id: recipient.id,
      })) as Tag[];
  }, [recipients]);

  return (
    <ThemedView style={[styles.container, { borderColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Who is this about?
        </ThemedText>
      </View>

      <View style={styles.body}>
        {editMode !== EditMode.VIEW ? (
          <TagInput
            value={recipientTags}
            tagPlaceholder="Enter a recipient name, or leave blank"
            onTagChange={(updatedTags) => {
              onRecipientChange?.(updatedTags as Recipient[]);
            }}
          />
        ) : (
          <ThemedText
            style={[
              styles.recipientText,
              { color: recipients ? textColor : placeholderColor },
            ]}
          >
            {recipients.map((recipient) => recipient.name).join(', ') || '—'}
          </ThemedText>
        )}
      </View>
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
  recipientText: {
    fontSize: 16,
    fontWeight: '400',
  },
});

export default PrayerRecipientSection;
