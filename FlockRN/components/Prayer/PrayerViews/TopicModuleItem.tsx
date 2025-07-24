import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TopicModuleItemProps {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function TopicModuleItem({
  label,
  value,
  icon,
  children,
}: TopicModuleItemProps) {
  const textColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'textPrimary');

  return (
    <View style={styles.item}>
      <View style={styles.textContainer}>
        <View style={styles.labelContainer}>
          <ThemedText
            type="default"
            style={[styles.label, { color: textColor }]}
          >
            {label}
          </ThemedText>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {icon && <View style={styles.iconContainerReverse}>{icon}</View>}
        </View>
        {value && (
          <ThemedText
            type="defaultSemiBold"
            style={[styles.value, { color: primaryColor }]}
          >
            {value}
          </ThemedText>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    marginLeft: 4,
    marginTop: -1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  iconContainerReverse: {
    width: 32,
    height: 32,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }, { rotate: '-3deg' }],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});
