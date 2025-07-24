import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '@/types/ComponentProps';

type TagInputProps = {
  tagPlaceholder?: string;
  onTagChange?: (tags: Tag[]) => void;
  value: Tag[];
};

export const TagInput = ({
  tagPlaceholder = 'Enter tag',
  onTagChange,
  value = [],
}: TagInputProps) => {
  const [tagText, setTagText] = useState('');

  // Removed unused textColor
  const iconColor = useThemeColor({}, 'textPrimaryReverse');
  const chipBgColor = useThemeColor({}, 'textPrimary');
  const chipTextColor = useThemeColor({}, 'textPrimaryReverse');

  const handleAddTag = () => {
    const trimmed = tagText.trim();
    if (
      !trimmed ||
      value.find((tag) => tag.name === trimmed) ||
      value.length >= 5
    )
      return;
    const newTags = [...value, { name: trimmed, id: 'unknown' }];
    setTagText('');
    onTagChange?.(newTags);
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    const newTags = value.filter((tag) => tag.name !== tagToRemove.name);
    onTagChange?.(newTags);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <ThemedTextInput
          value={tagText}
          onChangeText={setTagText}
          placeholder={tagPlaceholder}
          style={styles.input}
          variant="default"
          hasBorder
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
        />
        <TouchableOpacity onPress={handleAddTag} style={styles.plusButton}>
          <Ionicons name="add-circle-outline" size={24} color={chipBgColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.tagList}>
        {value.map((tag, idx) => (
          <View
            key={idx}
            style={[styles.tagChip, { backgroundColor: chipBgColor }]}
          >
            <Text style={[styles.tagText, { color: chipTextColor }]}>
              {tag.name}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveTag(tag)}
              style={styles.deleteButton}
            >
              <Ionicons name="close" size={16} color={iconColor} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    height: 40,
  },
  plusButton: {
    marginLeft: 8,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  deleteButton: {
    padding: 2,
  },
});
