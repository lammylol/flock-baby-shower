// Mock expo-file-system
export const documentDirectory = 'file:///test/documents/';
export const getInfoAsync = jest.fn();
export const makeDirectoryAsync = jest.fn();
export const readDirectoryAsync = jest.fn();
export const deleteAsync = jest.fn();

// Export all functions as a module for easier mocking
export default {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
  deleteAsync,
};
