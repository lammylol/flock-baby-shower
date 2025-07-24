import React from 'react';
import {
  Modal,
  Button,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView'; // Adjust import based on your file structure
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedKeyboardAvoidingView } from './ThemedKeyboardAvoidingView';

interface ReusableModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: () => void;
  actionTitle: string;
  children?: React.ReactNode;
}

const ReusableModal: React.FC<ReusableModalProps> = ({
  visible,
  onClose,
  onAction,
  actionTitle,
  children,
}) => {
  const backgroundOverlay = useThemeColor({}, 'modalOverlay'); // Adjust this to get the correct color based on your theme

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedKeyboardAvoidingView
          style={{ ...styles.overlay, backgroundColor: backgroundOverlay }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ThemedView style={styles.modalContainer}>
            {children}
            <ThemedView style={styles.buttonContainer}>
              <Button title="Cancel" onPress={onClose} color="#888" />
              <Button title={actionTitle ?? ''} onPress={onAction} />
            </ThemedView>
          </ThemedView>
        </ThemedKeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default ReusableModal;
