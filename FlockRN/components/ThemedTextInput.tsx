import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { forwardRef } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'multiline' | 'underline';
  hasBorder?: boolean;
};

export const ThemedTextInput = forwardRef<TextInput, ThemedTextInputProps>(
  (
    {
      style,
      lightColor,
      darkColor,
      variant = 'default',
      hasBorder = false,
      ...rest
    },
    ref,
  ) => {
    const color = useThemeColor(
      { light: lightColor, dark: darkColor },
      'textPrimary',
    );

    const borderColor = useThemeColor({}, 'borderPrimary');

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={useThemeColor({}, 'textSecondary')}
        style={[
          { color },
          variant === 'default' ? styles.default : undefined,
          variant === 'multiline' ? styles.multiline : undefined,
          variant === 'underline' ? styles.underline : undefined,
          hasBorder && { ...styles.border, borderColor },
          style,
        ]}
        {...rest}
      />
    );
  },
);

const styles = StyleSheet.create({
  default: {
    lineHeight: 20,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  border: {
    borderWidth: 1,
    borderRadius: 8,
  },
  multiline: {
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  underline: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
});
