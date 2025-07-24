import { useThemeColor } from '@/hooks/useThemeColor';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

// Loading screen component
const LoadingScreen = ({
  isTranscribing,
  processingTranscription,
  isAnalyzing,
}: {
  isTranscribing: boolean;
  processingTranscription: boolean;
  isAnalyzing: boolean;
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textPrimary');

  const getLoadingMessage = () => {
    if (isTranscribing) {
      return 'Transcribing your prayer...';
    }
    if (processingTranscription) {
      return 'Processing transcription...';
    }
    if (isAnalyzing) {
      return 'Analyzing your prayer content...';
    }
    return ' ';
  };

  const getSubMessage = () => {
    if (isTranscribing) {
      return 'Converting your voice to text';
    }
    if (processingTranscription) {
      return 'Preparing your prayer for analysis';
    }
    if (isAnalyzing) {
      return 'Identifying prayer points and themes';
    }
    return ' ';
  };

  return (
    <View style={[styles.loadingContainer, { backgroundColor }]}>
      <ActivityIndicator color={textColor} size="large" />
      <ThemedText
        type="default"
        style={[styles.loadingText, { color: textColor }]}
      >
        {getLoadingMessage()}
      </ThemedText>
      {getSubMessage() && (
        <ThemedText
          type="default"
          style={[styles.loadingSubText, { color: textColor }]}
        >
          {getSubMessage()}
        </ThemedText>
      )}
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 200,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
});
