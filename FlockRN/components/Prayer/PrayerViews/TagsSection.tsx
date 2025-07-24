import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { PrayerType } from '@/types/PrayerSubtypes';
import { prayerTags } from '@/types/Tag';

interface TagsListProps {
  tags: PrayerType[];
  onChange?: (tags: PrayerType[]) => void;
}

const getTagColor = (tag: string) =>
  Colors.tagColors.typeColors[
    tag as keyof typeof Colors.tagColors.typeColors
  ] || Colors.tagColors.defaultTag;

const TagsList = ({ tags, onChange }: TagsListProps) => {
  const [selectedTags, setSelectedTags] = useState<PrayerType[]>(tags);
  const [expanded, setExpanded] = useState(false);
  const backgroundColor = useThemeColor({ light: Colors.brown1 }, 'background');
  const textColor = useThemeColor({ light: Colors.brown2 }, 'textPrimary');

  const sortedTags = useMemo(() => {
    return [...selectedTags].sort((a, b) => tags.indexOf(a) - tags.indexOf(b));
  }, [selectedTags, tags]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  // inside TagsList component
  useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  const handleTagsChange = useCallback(
    (tag: PrayerType) => {
      setSelectedTags((prev) => {
        const next = prev.includes(tag) ? [] : [tag];
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const saveTags = async () => {
    toggleExpand();
    try {
      onChange?.(selectedTags);
    } catch {
      console.error('Error updating tags');
    }
  };

  const renderTag = useCallback(
    (tag: PrayerType, isSelectable = false) => (
      <TouchableOpacity
        key={tag}
        style={[
          styles.tag,
          {
            backgroundColor: selectedTags.includes(tag)
              ? getTagColor(tag)
              : Colors.tagColors.defaultTag,
          },
        ]}
        onPress={isSelectable ? () => handleTagsChange(tag) : toggleExpand}
      >
        <Text
          style={[
            styles.tagText,
            selectedTags.includes(tag) && styles.selectedTagText,
          ]}
        >
          {tag.charAt(0).toUpperCase() + tag.slice(1)}
        </Text>
      </TouchableOpacity>
    ),
    [handleTagsChange, selectedTags],
  );

  const allTagsRendered = useMemo(
    () => prayerTags.map((tag) => renderTag(tag, true)),
    [renderTag],
  );

  return (
    <View style={styles.container}>
      <ThemedText style={{ ...styles.tagsTitle }}>Tags:</ThemedText>
      {!expanded ? (
        <TouchableOpacity style={styles.tagsContainer} onPress={toggleExpand}>
          {sortedTags.map((tag) => renderTag(tag))}
          <TouchableOpacity style={styles.editButton} onPress={toggleExpand}>
            <Feather name="edit-2" size={14} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={styles.containerExpanded}>
          <View
            style={[styles.modalContent, { backgroundColor: backgroundColor }]}
          >
            <View style={styles.modalHeader}>
              <Text style={{ ...styles.modalTitle, color: textColor }}>
                Editing Tags
              </Text>
              <TouchableOpacity onPress={saveTags}>
                <Text style={{ ...styles.modalTitle, color: textColor }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>{allTagsRendered}</View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  containerExpanded: { marginHorizontal: -12 },
  editButton: {
    alignItems: 'center',
    backgroundColor: Colors.brown2,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  modalContent: {
    borderRadius: 12,
    padding: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '500' },
  selectedTagText: { color: Colors.white, fontWeight: '400' },
  tag: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { fontWeight: '400' },
  tagsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingRight: 20,
  },
  tagsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
});

export default TagsList;
