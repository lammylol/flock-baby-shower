import { StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { JSX } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';

const sizeMap = {
  xs: { height: 25 },
  s: { height: 33 },
  m: { height: 40 },
  l: { height: 50 },
  xl: { height: 60 },
} as const;

type SizeType = keyof typeof sizeMap;

const getSize = (size: SizeType) => sizeMap[size]; // Using sizeMap as a value

interface Props extends ViewStyle {
  label: string;
  size?: SizeType;
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  backgroundColor?: string;
  borderColor?: string;
  textProps?: TextStyle;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function Button({
  label,
  size = 's',
  startIcon,
  endIcon,
  backgroundColor,
  borderColor,
  textProps,
  onPress,
  style,
  disabled = false,
  ...rest
}: Props) {
  const buttonBackgroundColor = useThemeColor({}, 'textPrimary');
  const buttonTextColor = useThemeColor({}, 'textPrimaryReverse');
  const buttonHeight = getSize(size).height;
  const scaledFontSize = Math.round(buttonHeight * 0.45); // e.g. 40 * 0.45 = 18

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: backgroundColor ?? buttonBackgroundColor },
        { borderColor: borderColor ?? 'transparent' },
        { ...getSize(size), ...rest },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {startIcon ?? null}
      <ThemedText
        style={[
          styles.buttonLabel,
          {
            fontSize: scaledFontSize,
            ...textProps,
            color: textProps?.color ?? buttonTextColor,
          },
        ]}
      >
        {label}
      </ThemedText>
      {endIcon ?? null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1.25,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    padding: 3,
  },
  buttonLabel: {
    fontSize: 14,
  },
});
