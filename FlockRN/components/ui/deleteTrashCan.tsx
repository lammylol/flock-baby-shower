import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

type DeleteTrashCanProps = {
  onPress: () => void;
  disabled?: boolean;
  alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
};

export const DeleteTrashCan: React.FC<DeleteTrashCanProps> = ({
  onPress,
  disabled = false,
  alignSelf = 'center',
}) => {
  const color = useThemeColor(
    { light: Colors.red, dark: Colors.dark.textPrimary },
    'textPrimary',
  );

  return (
    <TouchableOpacity
      style={[styles.deleteIconButton, { alignSelf }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Delete"
      accessibilityRole="button"
    >
      <Ionicons name="trash-outline" size={24} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  deleteIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
