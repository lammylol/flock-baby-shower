import { StyleSheet, Platform, SafeAreaView } from 'react-native';
import Modal from 'react-native-modal';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import useRecordingContext from '@/hooks/recording/useRecordingContext';
import { ThemedView } from '@/components/ThemedView';
import Button from '@/components/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { From, FromProps } from '@/types/ComponentProps';
import CircleButton from '@/components/ui/CircleButton';
import { NavigationUtils } from '@/utils/navigation';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

interface PrayerCreateModalProps {
  visible: boolean;
  onClose: () => void;
  from?: FromProps;
}

export default function PrayerCreateModal({
  visible,
  onClose,
  from,
}: PrayerCreateModalProps) {
  const recordTextColor = useThemeColor({ light: Colors.white }, 'textPrimary');
  const backgroundColor = useThemeColor(
    { light: Colors.grey1 },
    'backgroundSecondary',
  );
  const textColor = useThemeColor({}, 'textPrimary');
  const modalBackgroundColor = useThemeColor({}, 'background');
  const { handleRecordPrayer, resetRecording } = useRecordingContext();

  const recordPrayer = () => {
    try {
      sentryAnalytics.trackRecordingMethod('record');
      sentryAnalytics.trackUserInteraction(
        'record_button_clicked',
        'PrayerCreateModal',
        'recordPrayer',
      );
      onClose();
      // Add a small delay to ensure modal is closed before navigation
      // setTimeout(() => {
      resetRecording();
      NavigationUtils.toVoiceRecording(from);
      handleRecordPrayer();
      // }, 100);
    } catch (error) {
      console.error('Error in recordPrayer:', error);
      // Fallback navigation
      NavigationUtils.resetAndNavigate('/(tabs)/(prayers)');
    }
  };

  const writePrayer = () => {
    try {
      sentryAnalytics.trackRecordingMethod('text');
      sentryAnalytics.trackUserInteraction(
        'text_button_clicked',
        'PrayerCreateModal',
        'writePrayer',
      );
      onClose();
      // Add a small delay to ensure modal is closed before navigation
      setTimeout(() => {
        if (from?.from === From.PRAYER_TOPIC && from?.fromId) {
          NavigationUtils.toCreatePrayerPoint(from);
        } else {
          NavigationUtils.toWritePrayer(from);
        }
      }, 100);
    } catch (error) {
      console.error('Error in writePrayer:', error);
      // Fallback navigation
      NavigationUtils.resetAndNavigate('/(tabs)/(prayers)');
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      statusBarTranslucent={Platform.OS === 'android'}
      useNativeDriver
      style={styles.modalContainer}
      backdropOpacity={0.1}
    >
      <SafeAreaView
        style={[styles.modalContent, { backgroundColor: modalBackgroundColor }]}
      >
        <ThemedView style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>PRAY!</ThemedText>
        </ThemedView>

        <ThemedView style={styles.contentContainer}>
          <ThemedText style={styles.questionText}>
            How do you want to add your prayer?
          </ThemedText>

          <Button
            label="Record"
            onPress={recordPrayer}
            startIcon={
              <IconSymbol
                name="microphone.fill"
                color={recordTextColor}
                size={20}
              />
            }
            size="l"
            textProps={{
              fontSize: 18,
              fontWeight: '600',
            }}
          />

          <Button
            label="Type"
            onPress={writePrayer}
            startIcon={
              <IconSymbol name="keyboard" color={textColor} size={24} />
            }
            size="l"
            backgroundColor={backgroundColor}
            textProps={{
              color: textColor,
              fontSize: 18,
              fontWeight: '500',
            }}
          />
        </ThemedView>
        <CircleButton
          onPress={onClose}
          iconName="xmark"
          iconSize={20}
          size={48}
          borderColor={textColor}
          iconColor={textColor}
          style={styles.closeButton}
          hapticFeedback={true}
        />
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  modalHeader: {
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    alignSelf: 'center',
    marginVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
