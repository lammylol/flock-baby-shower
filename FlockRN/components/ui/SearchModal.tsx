import React from 'react';
import { FlatList, StyleSheet, Text, View, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import SearchBar from './SearchBar';
import { Colors } from '@/constants/Colors';

const screenHeight = Dimensions.get('window').height;

interface SearchModalProps<T> {
  visible: boolean;
  onClose: () => void;
  setSearchQuery: (query: string) => void;
  results: T[];
  renderItem: (item: T) => React.ReactElement;
  placeholder?: string;
  title?: string;
}

export function SearchModal<T>({
  visible,
  onClose,
  setSearchQuery,
  results,
  renderItem,
  placeholder = 'Search...',
  title = 'Search',
}: SearchModalProps<T>) {
  const primaryColor = useThemeColor({}, 'textPrimary');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      propagateSwipe
      useNativeDriver={false} // temp fix for keyboard issue
    >
      <ThemedView
        style={[
          styles.container,
          { backgroundColor, height: screenHeight * 0.85 },
        ]}
      >
        <View style={styles.grabber} />
        <Text style={[styles.title, { color: primaryColor }]}>{title}</Text>
        <SearchBar placeholder={placeholder} onSearch={setSearchQuery} />
        <FlatList
          style={styles.list}
          data={results}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => renderItem(item)}
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 4,
  },
  grabber: {
    width: 50,
    height: 5,
    backgroundColor: Colors.greyGrabber,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  list: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
});
