import { ViewProps, StyleSheet, Platform } from 'react-native';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export type HeaderButtonProps = {
  onPress: () => void;
  label: string;
  style?: ViewProps;
  hasBackIcon?: boolean;
};

export function HeaderButton({
  onPress,
  label,
  style,
  hasBackIcon,
  ...rest
}: HeaderButtonProps) {
  const colorScheme = useThemeColor({}, 'textPrimary');

  const backIcon = hasBackIcon ? (
    <Ionicons
      name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
      size={24}
      color={colorScheme}
    />
  ) : null;

  return (
    <Button
      size={'m'}
      onPress={onPress}
      label={label}
      startIcon={backIcon as React.ReactElement}
      textProps={StyleSheet.flatten([
        styles.headerTitleStyle,
        { color: colorScheme },
      ])}
      backgroundColor={'transparent'}
      style={style}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '400',
  },
});
