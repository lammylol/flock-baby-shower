import { StyleProp, ViewStyle, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { JSX } from 'react';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import HapticFeedback from 'react-native-haptic-feedback';

export interface CircleButtonProps {
  onPress: () => void;
  bottom?: number;
  right?: number;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconName: IconSymbolName;
  iconSize?: number;
  iconWeight?: 'regular' | 'bold';
  iconColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  hapticFeedback?: boolean;
}

export function CircleButton({
  onPress,
  bottom = 0,
  right = 0,
  disabled = false,
  size = 56,
  style = {},
  iconName,
  iconSize = 24,
  iconWeight = 'bold',
  iconColor = '#fff',
  backgroundColor = 'transparent',
  borderColor = 'transparent',
  hapticFeedback = false,
}: CircleButtonProps): JSX.Element {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    if (!disabled) {
      if (hapticFeedback) {
        HapticFeedback.trigger('keyboardPress');
      }
      onPress();
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.circleButtonContainer,
        {
          bottom,
          right,
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.circleButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor,
            ...(borderColor
              ? { borderColor: borderColor, borderWidth: 1 }
              : {}),
          },
          animatedStyle,
        ]}
      >
        <IconSymbol
          name={iconName}
          size={iconSize}
          weight={iconWeight}
          color={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circleButtonContainer: {},
  circleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircleButton;
