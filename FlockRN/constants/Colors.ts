/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { iconBackgroundColors, tagColors } from './TagColors';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  // Base colors
  white: '#ffffff',
  black: '#000000',
  red: '#FF3B30',
  green: '#82B261',
  cream: '#FDFAE2',
  link: '#007aff',
  disabled: '#cccccc',

  // Branding / Accent
  primary: '#82B261', // Purple button color
  secondary: '#23242B', // Beige background
  secondaryLight: '#ECEADD',
  yellow: '#EAD24C',
  yellowDark: '#D59927',
  brown1: '#F5E9DC80',
  brown2: '#9C8B77',
  grey1: '#F5F5F5',
  greyGrabber: '#ccc',
  border: '#C6C6C8',

  // Theme-specific values
  light: {
    backgroundLight: '#F5F5F5',
    background: '#ffffff',
    backgroundCream: '#FDFAE2',
    backgroundSecondary: '#EEF8E2',
    backgroundVoiceRecording: '#82B261',
    textPrimary: '#23242B',
    textPrimaryReverse: '#ffffff',
    textSecondary: '#49454F',
    textOnBackgroundColor: '#ffffff',
    borderPrimary: '#F5F5F5',
    modalOverlay: '#00000080',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },

  dark: {
    backgroundLight: '#2C2E3A',
    background: '#1c1d22',
    backgroundSecondary: '#1C1D22',
    backgroundVoiceRecording: '#2C2E3A',
    textPrimary: '#E4E5E9',
    textPrimaryReverse: '#11181C',
    textSecondary: '#818591',
    textOnBackgroundColor: '#151718',
    borderPrimary: '#818591',
    modalOverlay: '#ffffff33',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },

  // Additional color mappings
  tagColors,
  iconBackgroundColors,
};
