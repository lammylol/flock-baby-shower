// components/PrayerCardHeader.tsx

import { useThemeColor } from '@/hooks/useThemeColor';
import { PrayerType, EntityType } from '@/types/PrayerSubtypes';
import {
  useColorScheme,
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { ThemedText } from '../ThemedText';
import { IconBackgroundSquare } from './IconBackgroundSquare';
import { ThemedView } from '@/components/ThemedView';
import { Entypo } from '@expo/vector-icons';

type PrayerCardHeaderProps = {
  title: string;
  subtitle?: string;
  iconType?: PrayerType;
  entityType: EntityType;
  editable?: boolean;
  isEditMode?: boolean;
  onEditPress?: () => void;
  onTitleChange?: (title: string) => void;
};

export const PrayerCardHeader: React.FC<PrayerCardHeaderProps> = ({
  title,
  subtitle,
  iconType,
  entityType,
  editable,
  isEditMode = false,
  onEditPress,
  onTitleChange,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const subtitleColor = useThemeColor({}, 'textSecondary');
  const editButtonColor = useThemeColor({}, 'textPrimary');
  const isPrayer = entityType === EntityType.Prayer;

  return (
    <View style={styles.headerContainer}>
      {!isPrayer && (
        <IconBackgroundSquare
          entityType={entityType}
          {...(iconType ? { type: iconType } : {})}
        />
      )}
      <View style={styles.headerTextContainer}>
        {isEditMode ? (
          <TextInput
            value={title}
            onChangeText={onTitleChange}
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
        ) : (
          <ThemedText style={styles.titleText} numberOfLines={1}>
            {title}
          </ThemedText>
        )}

        {!isPrayer && subtitle && (
          <ThemedText
            style={[styles.subtitle, { color: subtitleColor }]}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>

      {editable && !isEditMode && (
        <Pressable onPress={onEditPress} style={styles.editContainer}>
          <ThemedView
            style={[styles.editButton, { backgroundColor: editButtonColor }]}
          >
            <Entypo name="edit" size={10} color={Colors.white} />
          </ThemedView>
          <ThemedText style={styles.editText}>
            {!isEditMode ? 'Edit' : 'Done'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  editButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  editContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'flex-start',
  },
  editText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
});
