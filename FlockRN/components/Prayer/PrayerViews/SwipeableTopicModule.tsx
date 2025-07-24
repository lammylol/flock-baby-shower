import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width: screenWidth } = Dimensions.get('window');

export interface SwipeableTopicModuleProps {
  modules: React.ReactNode[];
  containerStyle?: React.ComponentProps<typeof View>['style'];
}

export function SwipeableTopicModule({
  modules,
  containerStyle,
}: SwipeableTopicModuleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const containerWidth = screenWidth - 48; // Account for padding

  const dotColor = useThemeColor({}, 'textSecondary');
  const activeDotColor = useThemeColor({}, 'textPrimary');

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / containerWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * containerWidth,
      animated: true,
    });
    setCurrentIndex(index);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {modules.map((module, index) => (
          <View
            key={index}
            style={[styles.moduleContainer, { width: containerWidth }]}
          >
            {module}
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {modules.length > 1 && (
        <View style={styles.dotsContainer}>
          {modules.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? activeDotColor : dotColor,
                },
              ]}
              onTouchEnd={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  moduleContainer: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
});
