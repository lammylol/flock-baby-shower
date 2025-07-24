import { useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

export const useScrollDirection = () => {
  const [isScrolling, setIsScrolling] = useState(false);

  const lastScrollY = useSharedValue(0);
  const lastTimestamp = useRef(0);
  const velocityHistory = useRef<number[]>([]);
  const hideSidebarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      lastScrollY.value,
      [0, 100],
      [235, 0],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      lastScrollY.value,
      [0, 40],
      [1, 0],
      Extrapolation.CLAMP,
    );

    const marginTop = interpolate(
      lastScrollY.value,
      [0, 100],
      [24, 0],
      Extrapolation.CLAMP,
    );

    return {
      height,
      opacity,
      marginTop,
    };
  });

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const now = Date.now();

      const dy = y - lastScrollY.value;
      const dt = now - lastTimestamp.current || 1;

      lastScrollY.value = y;
      lastTimestamp.current = now;

      const velocity = Math.abs(dy / dt);
      velocityHistory.current.push(velocity);
      if (velocityHistory.current.length > 5) velocityHistory.current.shift();

      if (!isScrolling && velocity > 0.5) setIsScrolling(true);
      if (hideSidebarTimeout.current) clearTimeout(hideSidebarTimeout.current);
      hideSidebarTimeout.current = setTimeout(
        () => setIsScrolling(false),
        500,
      ) as ReturnType<typeof setTimeout>;
    },
    [isScrolling, lastScrollY],
  );

  return { handleScroll, isScrolling, titleAnimatedStyle };
};
