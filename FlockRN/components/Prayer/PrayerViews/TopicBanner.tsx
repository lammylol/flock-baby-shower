// TopicBanner.tsx
import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface TopicBannerProps {
  borderColor?: string;
  backgroundColor?: string;
  children: ReactNode;
}

export const TopicBanner: React.FC<TopicBannerProps> = ({
  borderColor,
  backgroundColor,
  children,
}) => {
  return (
    <View
      style={[
        styles.wrapper,
        borderColor ? styles.border : {},
        borderColor ? { borderColor } : {},
        backgroundColor ? { backgroundColor } : {},
      ]}
    >
      <View style={styles.labelContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  border: {
    borderWidth: 1.25,
  },
  wrapper: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
