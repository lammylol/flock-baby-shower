import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  backgroundColor: string;
}

const IconButton: React.FC<ButtonProps> = ({
  icon,
  label,
  onPress,
  backgroundColor,
}) => {
  const iconColor = Colors.white;
  const textColor = useThemeColor({}, 'textPrimary');
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.button, { backgroundColor }]}
      >
        <FontAwesome6 name={icon} size={32} color={iconColor} solid />
      </TouchableOpacity>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

export const RecordButton: React.FC<{
  isRecording: boolean;
  onPress: () => void;
}> = ({ isRecording, onPress }) => (
  <IconButton
    icon={isRecording ? 'stop' : 'play'}
    label={isRecording ? 'Stop' : 'Resume'}
    onPress={onPress}
    backgroundColor="#D32F2F"
  />
);

export const FinishButton: React.FC<{ onPress: () => void }> = ({
  onPress,
}) => {
  const backgroundColor = useThemeColor({}, 'textSecondary');
  return (
    <IconButton
      icon="circle"
      label="Finish"
      onPress={onPress}
      backgroundColor={backgroundColor}
    />
  );
};

export const RetryButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <IconButton
    icon="arrow-rotate-right"
    label="Retry"
    onPress={onPress}
    backgroundColor="#999999"
  />
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  container: {
    alignItems: 'center',
  },
  // eslint-disable-next-line react-native/no-color-literals
  text: {
    color: 'black',
    fontSize: 16,
    marginTop: 8,
  },
});
