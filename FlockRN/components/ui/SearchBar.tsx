import { JSX, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Keyboard,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { debounce } from 'lodash';
import { ThemedTextInput } from '../ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from './IconSymbol';

export type SearchBarProps = {
  placeholder?: string;
  onSearch?: (searchText: string) => void;
  openModalOnFocus?: boolean;
  onPress?: () => void;
  focusedOnRender?: boolean;
  startAsCircle?: boolean;
};

export default function SearchBar({
  placeholder = 'Search',
  onSearch,
  openModalOnFocus = false,
  onPress,
  focusedOnRender = false,
  startAsCircle = false,
}: SearchBarProps): JSX.Element {
  const [shouldFocus, setShouldFocus] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!startAsCircle);
  const inputRef = useRef<TextInput>(null);
  const animatedOpacity = useRef(
    new Animated.Value(startAsCircle ? 0 : 1),
  ).current;
  const textColor = useThemeColor({}, 'textPrimary');
  const backgroundColor = useThemeColor(
    { light: Colors.grey1 },
    'backgroundSecondary',
  );

  const handleDebouncedSearch = debounce((text: string) => {
    if (onSearch) {
      onSearch(text);
    }
  }, 500);

  const onChangeText = (text: string) => {
    setSearchText(text);

    if (openModalOnFocus) return;

    if (text === '') {
      setSearchEnabled(false);
    }
    handleDebouncedSearch(text);
  };

  const handleFocus = () => {
    if (openModalOnFocus && onPress) {
      Keyboard.dismiss();
      onPress();
    } else {
      setShouldFocus(true);
      setSearchEnabled(true);
    }
  };

  const handleCirclePress = () => {
    if (startAsCircle && !isExpanded) {
      setIsExpanded(true);
      setSearchEnabled(true);

      // Animate the opacity
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        // Focus the input after animation
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      });
    } else {
      handleFocus();
    }
  };

  const handleOutsidePress = () => {
    if (startAsCircle && isExpanded) {
      // Collapse back to circle
      setIsExpanded(false);
      setSearchEnabled(false);
      setSearchText('');
      Keyboard.dismiss();

      // Animate the collapse
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  useEffect(() => {
    if (focusedOnRender || (shouldFocus && searchEnabled)) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [focusedOnRender, searchEnabled, shouldFocus]);

  // If starting as circle and not expanded, show just the icon
  if (startAsCircle && !isExpanded) {
    return (
      <Pressable style={styles.circleContainer} onPress={handleCirclePress}>
        <View style={[styles.circle, { backgroundColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textColor} />
        </View>
      </Pressable>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={[styles.container, { backgroundColor }]}>
        {openModalOnFocus || !searchEnabled ? (
          <Pressable style={styles.pressable} onPress={handleFocus}>
            <View pointerEvents="none" style={styles.view}>
              <IconSymbol name="magnifyingglass" size={20} color={textColor} />
              <Animated.View
                style={[
                  styles.animatedInputContainer,
                  { opacity: animatedOpacity },
                ]}
              >
                <ThemedTextInput
                  style={styles.input}
                  placeholder={placeholder}
                  value={searchText}
                  editable={false}
                />
              </Animated.View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.view}>
            <IconSymbol name="magnifyingglass" size={20} color={textColor} />
            <Animated.View
              style={[
                styles.animatedInputContainer,
                { opacity: animatedOpacity },
              ]}
            >
              <ThemedTextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                value={searchText}
                onChangeText={onChangeText}
                onBlur={() => setSearchEnabled(false)}
                clearButtonMode="while-editing"
              />
            </Animated.View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 40,
    paddingHorizontal: 16,
    width: '100%',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    height: 40,
    width: '100%',
  },
  pressable: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  animatedInputContainer: {
    flex: 1,
  },
});
