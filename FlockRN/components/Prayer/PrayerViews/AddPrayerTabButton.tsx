import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { JSX } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CircleButton } from '../../ui/CircleButton';
import { Colors } from '@/constants/Colors';

export interface PrayerTabButtonProps {
  onPress: () => void;
  bottom: number;
  disabled: boolean;
  size: number;
  right: number;
  style: StyleProp<ViewStyle>;
}

export function PrayerTabButton({
  onPress,
  bottom,
  right,
  disabled = false,
  size = 56,
  style = {},
}: PrayerTabButtonProps): JSX.Element {
  const textColor = useThemeColor({}, 'textPrimaryReverse');
  const backgroundColor = useThemeColor(
    { dark: Colors.dark.textPrimary },
    'backgroundVoiceRecording',
  );

  return (
    <CircleButton
      onPress={onPress}
      bottom={bottom}
      right={right}
      disabled={disabled}
      size={size}
      style={[style, styles.shadow]}
      iconName="chevron.up"
      iconSize={32}
      iconColor={textColor}
      backgroundColor={backgroundColor}
    />
  );
}

export default PrayerTabButton;

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
