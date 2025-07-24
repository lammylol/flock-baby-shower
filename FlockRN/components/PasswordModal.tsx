import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform, View } from 'react-native';
import Modal from 'react-native-modal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import Button from '@/components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedKeyboardAvoidingView } from './ThemedKeyboardAvoidingView';
import { Colors } from '@/constants/Colors';

interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  correctPassword?: string;
}

export default function PasswordModal({
  visible,
  onClose,
  onSuccess,
  title = 'Enter Password',
  correctPassword = '1234', // Default password, you can change this
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const textColor = useThemeColor({}, 'textPrimary');
  const modalBackgroundColor = useThemeColor({}, 'background');

  const handleSubmit = () => {
    if (password === correctPassword) {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect password');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      statusBarTranslucent={Platform.OS === 'android'}
      useNativeDriver
      style={styles.modalContainer}
      backdropOpacity={0.1}
    >
      <ThemedKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ThemedView style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <IconSymbol name="xmark" color={textColor} size={20} />
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>{title}</ThemedText>
          <View style={styles.headerSpacer} />
        </ThemedView>

        <ThemedView style={styles.contentContainer}>
          <ThemedView style={styles.passwordContainer}>
            <ThemedTextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              secureTextEntry={!showPassword}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
          </ThemedView>

          {error ? (
            <ThemedText style={[styles.errorText, { color: Colors.red[500] }]}>
              {error}
            </ThemedText>
          ) : null}

          <Button
            label="Submit"
            onPress={handleSubmit}
            size="l"
            textProps={{
              fontSize: 18,
              fontWeight: '600',
            }}
          />
        </ThemedView>
      </ThemedKeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
