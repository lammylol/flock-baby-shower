import { StyleSheet, ViewStyle } from 'react-native';
import { JSX } from 'react';
import { CircleButton } from '../../ui/CircleButton';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface FloatingTopicButtonProps {
  bottom: number;
  right: number;
  style?: ViewStyle;
  onPress: () => void;
}

export function FloatingAddTopicButton({
  bottom,
  right,
  style,
  onPress,
}: FloatingTopicButtonProps): JSX.Element {
  const textColor = useThemeColor({}, 'textOnBackgroundColor');
  const backgroundColor = useThemeColor({}, 'textOnBackgroundColor');

  return (
    <CircleButton
      onPress={onPress}
      bottom={bottom}
      right={right}
      iconName="plus"
      iconSize={24}
      iconColor={textColor}
      backgroundColor={
        typeof style?.backgroundColor === 'string'
          ? style.backgroundColor
          : (backgroundColor as string)
      }
      style={StyleSheet.flatten([
        styles.floatingButton,
        { bottom: bottom, right: right },
        style,
      ])}
    />
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    alignItems: 'center',
    borderRadius: 30,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 9999,
  },
});
