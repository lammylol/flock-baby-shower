import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getAuthorBadgeColorByInitial } from '@/constants/AuthorBadgeColors';
import { Colors } from '@/constants/Colors';

type AuthorBadgeProps = {
  authorName: string;
  uid?: string;
  size?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase();
};

export const AuthorBadge = ({
  authorName,
  size = 32,
  style,
  textStyle,
  color,
}: AuthorBadgeProps) => {
  const initials = getInitials(authorName);

  // const backgroundColor = useThemeColor({}, 'textPrimary');
  const backgroundColor = color ?? getAuthorBadgeColorByInitial(initials);
  const textColor =
    color ??
    useThemeColor({ dark: Colors.light.textPrimaryReverse }, 'backgroundCream');
  const borderColor = useThemeColor({}, 'textPrimary');

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
        { backgroundColor },
      ]}
    >
      <ThemedText style={[styles.initials, textStyle, { color: textColor }]}>
        {initials}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 0.1,
  },
  initials: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
