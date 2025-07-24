import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  GestureResponderEvent,
  useColorScheme,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { BlurView } from 'expo-blur';

type Props = {
  dateKeys: string[];
  onPress: (dateKey: string) => void;
};

const MAX_TICKS = 12;
const BASE_SIDEBAR_HEIGHT = 280;
const MIN_SIDEBAR_HEIGHT = 100;
const MAX_SIDEBAR_HEIGHT = 300;

export default function RulerSidebar({ dateKeys, onPress }: Props) {
  const theme = useColorScheme();
  const textColor = useThemeColor({}, 'textPrimary');
  const sidebarRef = useRef<View>(null);
  const [tickHeight, setTickHeight] = useState(0);
  const [activeTickIndex, setActiveTickIndex] = useState<number | null>(null);

  const initialTouchY = useRef<number | null>(null);
  const todayButtonHeight = useRef(0);
  const sidebarTop = useRef(0);
  const touchOffset = useRef(0);

  const hasMultipleYears = useMemo(() => {
    const years = new Set(dateKeys.map((key) => key.split('-')[0]));
    return years.size > 1;
  }, [dateKeys]);

  const ticks = useMemo(() => {
    if (dateKeys.length === 0) return [];
    const interval = Math.floor(dateKeys.length / MAX_TICKS) || 1;
    return dateKeys.filter((_, i) => i % interval === 0);
  }, [dateKeys]);

  // Calculate dynamic sidebar height based on number of items
  const sidebarHeight = useMemo(() => {
    if (dateKeys.length <= 5) {
      // For very few items, use minimum height to spread ticks apart
      return MIN_SIDEBAR_HEIGHT;
    } else if (dateKeys.length <= 20) {
      // For moderate number of items, scale between min and base
      const ratio = (dateKeys.length - 5) / (20 - 5);
      return (
        MIN_SIDEBAR_HEIGHT + (BASE_SIDEBAR_HEIGHT - MIN_SIDEBAR_HEIGHT) * ratio
      );
    } else if (dateKeys.length <= 50) {
      // For many items, scale between base and max
      const ratio = (dateKeys.length - 20) / (50 - 20);
      return (
        BASE_SIDEBAR_HEIGHT + (MAX_SIDEBAR_HEIGHT - BASE_SIDEBAR_HEIGHT) * ratio
      );
    } else {
      // For very many items, use maximum height
      return MAX_SIDEBAR_HEIGHT;
    }
  }, [dateKeys.length]);

  const calculateTickHeight = useCallback(() => {
    const availableHeight = sidebarHeight - todayButtonHeight.current;
    return availableHeight / (ticks.length - 1 || 1);
  }, [ticks.length, sidebarHeight]);

  useEffect(() => {
    setTickHeight(calculateTickHeight());
  }, [calculateTickHeight]);

  const handlePan = useCallback(
    (evt: GestureResponderEvent) => {
      const y = evt.nativeEvent.pageY - sidebarTop.current;

      if (initialTouchY.current === null) {
        initialTouchY.current = y;
        const index = Math.floor(y / tickHeight);
        if (index >= 0 && index < ticks.length) {
          touchOffset.current = y % tickHeight;
          setActiveTickIndex(index);
          onPress(ticks[index]);
        }
        return;
      }

      const adjustedY = y - touchOffset.current;
      const index = Math.floor(adjustedY / tickHeight);

      if (index >= 0 && index < ticks.length) {
        setActiveTickIndex(index);
        HapticFeedback.trigger('keyboardTap');
        onPress(ticks[index]);
      }
    },
    [ticks, tickHeight, onPress],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: handlePan,
        onPanResponderMove: handlePan,
        onPanResponderRelease: () => {
          initialTouchY.current = null;
          touchOffset.current = 0;
          setActiveTickIndex(null);
        },
      }),
    [handlePan],
  );

  return (
    <View style={[styles.sidebar, { height: sidebarHeight }]} ref={sidebarRef}>
      <BlurView
        intensity={5}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <Pressable
          onPress={() => onPress(ticks[0])}
          onLayout={(e) => {
            todayButtonHeight.current = e.nativeEvent.layout.height;
          }}
        >
          <Text style={[styles.todayText, { color: textColor }]}>Today</Text>
        </Pressable>

        <View
          style={styles.ticksContainer}
          {...panResponder.panHandlers}
          onLayout={() => {
            sidebarRef.current?.measureInWindow((_, y) => {
              sidebarTop.current = y;
            });
          }}
        >
          {ticks.map((key, index) => {
            const [year = '', month = '', day = ''] = key.split('-');
            const showLabel = index % 5 === 4;
            const isActive = index === activeTickIndex;

            return (
              <Pressable
                key={key}
                onPress={() => onPress(key)}
                style={[
                  styles.tickContainer,
                  { height: tickHeight },
                  isActive && styles.tickContainerActive,
                ]}
              >
                {showLabel ? (
                  <Text
                    style={[
                      styles.label,
                      isActive && styles.labelActive,
                      { color: textColor },
                    ]}
                  >
                    {hasMultipleYears
                      ? year
                      : `${new Date(`${year}-${month}-${day}`).toLocaleString('en-US', { month: 'short' })} ${day}`}
                  </Text>
                ) : (
                  <View
                    style={[
                      styles.tick,
                      isActive && styles.tickActive,
                      { backgroundColor: textColor },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 12,
    right: 0,
    borderRadius: 12,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '400',
  },
  ticksContainer: {
    flex: 1,
    width: '100%',
  },
  tickContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Increase the size of the tickContainerActive style for better visibility
  tickContainerActive: {
    borderRadius: 6,
  },
  tick: {
    width: 10,
    height: 2,
    backgroundColor: Colors.light.textSecondary,
    marginRight: 4,
  },
  tickActive: {
    backgroundColor: Colors.link,
    height: 3,
    width: 12,
  },
  label: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  labelActive: {
    color: Colors.link,
    fontWeight: '600',
  },
});
