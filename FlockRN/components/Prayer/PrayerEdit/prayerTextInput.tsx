import { ThemedTextInput } from '@/components/ThemedTextInput';
import { StyleSheet, View } from 'react-native';

export function PrayerTextInput({
  placeholder,
  value,
  onChangeText,
  placeholderTextColor,
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholderTextColor: string;
}) {
  const handleTextChange = (text: string) => {
    // Manual sentence capitalization
    const capitalizedText = capitalizeSentences(text);
    onChangeText(capitalizedText);
  };

  // must implement this manually because the autoCapitalize="sentences" is not working.
  const capitalizeSentences = (text: string): string => {
    // Handle empty string
    if (!text) return text;

    // Capitalize first character of the entire text
    let result = text.charAt(0).toUpperCase() + text.slice(1);

    // Capitalize after sentence-ending punctuation (., !, ?) followed by space(s)
    // This regex looks for:
    // - Sentence ending punctuation: [.!?]
    // - One or more spaces: \s+
    // - A lowercase letter: ([a-z])
    result = result.replace(
      /([.!?]\s+)([a-z])/g,
      (match, punctuation, letter) => {
        return punctuation + letter.toUpperCase();
      },
    );

    // Capitalize after line breaks (new lines)
    result = result.replace(/(\n\s*)([a-z])/g, (match, newline, letter) => {
      return newline + letter.toUpperCase();
    });

    return result;
  };

  return (
    <View style={styles.mainContainer}>
      <ThemedTextInput
        placeholder={placeholder}
        value={value}
        onChangeText={handleTextChange}
        multiline
        autoComplete="off"
        placeholderTextColor={placeholderTextColor}
        style={styles.input}
        autoCapitalize="sentences"
        autoCorrect
        keyboardType="default"
        textContentType="none"
        returnKeyType="done"
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  mainContainer: {
    padding: 8,
  },
});
