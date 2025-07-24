import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { StyleSheet, View, Text, Image } from 'react-native';

// Import the Flock symbol image
import flockSymbol from '@/assets/images/flock_branding/flock_SYMBOL.png';

export const prayerTypeEmojis = {
  request: '🙏',
  praise: '🙌',
  repentance: '🫴',
};

export interface IconBackgroundSquare {
  entityType: EntityType;
  type?: PrayerType; // only used for prayer points
  customValue?: string;
  customBackground?: string;
}

/**
 * IconBackgroundSquare component that displays an icon in a colored square background.
 *
 * @example
 * // PrayerTopic automatically uses Flock symbol
 * <IconBackgroundSquare entityType={EntityType.PrayerTopic} />
 *
 * // PrayerPoint uses emoji based on type
 * <IconBackgroundSquare entityType={EntityType.PrayerPoint} type="request" />
 */
export const IconBackgroundSquare: React.FC<IconBackgroundSquare> = ({
  entityType,
  type,
  customValue,
  customBackground,
}) => {
  const defaultTagBackground = useThemeColor(
    { light: Colors.iconBackgroundColors.defaultTag },
    'backgroundSecondary',
  );

  let backgroundColor: string;
  let emoji: string = '📚'; // Default emoji
  let showFlockSymbol: boolean = false;

  if (entityType === EntityType.PrayerTopic) {
    backgroundColor = customBackground ?? defaultTagBackground;
    showFlockSymbol = true;
  } else if (entityType === EntityType.PrayerPoint && type) {
    backgroundColor = Colors.iconBackgroundColors.typeColors[type];
    emoji = prayerTypeEmojis[type];
  } else if (customValue) {
    backgroundColor =
      customBackground ?? Colors.iconBackgroundColors.defaultTag;
    emoji = customValue;
  } else {
    backgroundColor =
      customBackground ?? Colors.iconBackgroundColors.defaultTag;
    emoji = '📚';
  }

  return (
    <View style={[styles.background, { backgroundColor }]}>
      {showFlockSymbol ? (
        <Image source={flockSymbol} style={styles.flockSymbol} />
      ) : (
        <Text style={styles.text}>{emoji}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    borderRadius: 6,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  // eslint-disable-next-line react-native/no-color-literals
  text: {
    color: 'black',
    fontSize: 24,
  },
  flockSymbol: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});
