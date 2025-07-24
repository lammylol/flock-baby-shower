import { View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const TagLabel = ({
  label,
  tagBackgroundColor,
  tagTextColor,
}: {
  label: string;
  tagBackgroundColor?: string;
  tagTextColor?: string;
}) => {
  const tagBackground = tagBackgroundColor ?? useThemeColor({}, 'textPrimary');
  const tagText =
    tagTextColor ??
    useThemeColor({ dark: Colors.light.textPrimaryReverse }, 'backgroundCream');

  return (
    <View style={[styles.topicTag, { backgroundColor: tagBackground }]}>
      <ThemedText style={[styles.topicText, { color: tagText }]}>
        {`${label?.charAt(0).toUpperCase()}${label?.slice(1)}`}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  topicTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '400',
  },
});
