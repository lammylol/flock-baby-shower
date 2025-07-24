import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type CollapsibleProps = {
  title: string | ReactNode;
  textSize?: number;
  collapsedContent?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
} & PropsWithChildren;

export function Collapsible({
  title,
  textSize,
  collapsedContent,
  children,
  isOpen = true,
  onToggle,
}: CollapsibleProps) {
  const theme = useColorScheme() ?? 'light';

  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);
  const measured = useRef(false);

  useEffect(() => {
    if (!measured.current) return;
    height.value = withTiming(isOpen ? contentHeight : 0, { duration: 100 });
    opacity.value = withTiming(isOpen ? 1 : 0, { duration: 100 });
  }, [isOpen, contentHeight, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const h = event.nativeEvent.layout.height;
    if (!measured.current || contentHeight !== h) {
      measured.current = true;
      setContentHeight(h);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headingContainer}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <ThemedView style={styles.heading}>
          {typeof title === 'string' ? (
            <ThemedText
              type="defaultSemiBold"
              style={textSize ? { fontSize: textSize } : undefined}
            >
              {title}
            </ThemedText>
          ) : (
            title
          )}
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
            style={{
              transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
            }}
          />
        </ThemedView>
      </TouchableOpacity>

      {!isOpen && collapsedContent && (
        <TouchableOpacity
          onPress={onToggle}
          activeOpacity={0.9}
          style={styles.collapsedContent}
        >
          {collapsedContent}
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.contentWrapper, animatedStyle]}>
        <View>{children}</View>
      </Animated.View>

      <View
        style={styles.hiddenContent}
        onLayout={handleLayout}
        pointerEvents="none"
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  contentWrapper: {
    overflow: 'hidden',
  },
  headingContainer: {
    paddingVertical: 10,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedContent: {
    marginTop: 6,
  },
  hiddenContent: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: -1,
  },
});
