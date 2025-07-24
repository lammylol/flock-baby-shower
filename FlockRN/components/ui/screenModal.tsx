import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Modal from 'react-native-modal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ScreenModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  modalStyle?: object;
  contentStyle?: object;
  headerStyle?: object;
  animationType: {
    animationIn: 'slideInUp' | 'slideInRight';
    animationOut: 'slideOutDown' | 'slideOutLeft';
  };
}

export default function ScreenModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = false,
  modalStyle = {},
  contentStyle = {},
  headerStyle = {},
  animationType = {
    animationIn: 'slideInUp',
    animationOut: 'slideOutDown',
  },
}: ScreenModalProps) {
  const textColor = useThemeColor({}, 'textPrimary');
  const modalBackgroundColor = useThemeColor({}, 'background');

  // Memoize the close handler
  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      animationIn={animationType.animationIn}
      animationOut={animationType.animationOut}
      statusBarTranslucent={Platform.OS === 'android'}
      useNativeDriver
      style={[styles.modalContainer, modalStyle]}
      backdropOpacity={0.1}
    >
      <SafeAreaView
        style={[
          styles.modalContent,
          { backgroundColor: modalBackgroundColor },
          contentStyle,
        ]}
      >
        {(title || showCloseButton) && (
          <ThemedView style={[styles.modalHeader, headerStyle]}>
            {showCloseButton ? (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <IconSymbol name="xmark" color={textColor} size={20} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
            {title ? (
              <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            ) : (
              <View style={styles.headerSpacer} />
            )}
            <View style={styles.headerSpacer} />
          </ThemedView>
        )}
        {children}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0, // Fullscreen
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    flexGrow: 1,
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
});
