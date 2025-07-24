import app from '@/firebase/firebaseConfig';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
// this file handles the uploading and downloading of files to firebase storage
// it is mainly used in the recording service to upload and download the audio files.

const storage = getStorage(app);

// Define types for function parameters
export const uploadFile = async (
  filePath: string,
  fileName: string,
): Promise<void> => {
  // Create the file metadata
  /** @type {any} */
  const metadata = {
    contentType: 'audio/m4a',
  };
  const blob = await fetch(filePath).then((r) => r.blob());
  // Upload file and metadata to the object fileName
  const storageRef = ref(storage, fileName);
  const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(
    'state_changed',
    (snapshot) => {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case 'paused':
          console.log('Upload is paused');
          break;
        case 'running':
          console.log('Upload is running');
          break;
      }
    },
    (error) => {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      switch (error.code) {
        case 'storage/unauthorized':
          // User doesn't have permission to access the object
          break;
        case 'storage/canceled':
          // User canceled the upload
          break;

        // ...

        case 'storage/unknown':
          // Unknown error occurred, inspect error.serverResponse
          break;
      }
    },
    () => {
      // Upload completed successfully, now we can get the download URL
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
      });
    },
  );
};

export const downloadFile = async (
  fileName: string,
  toFilePath: string,
): Promise<string> => {
  const storageRef = ref(storage, fileName);
  const url = await getDownloadURL(storageRef);
  const result = await FileSystem.downloadAsync(url, toFilePath);
  return result.uri;
};

export const checkIfFileExists = async (filePath: string): Promise<boolean> => {
  const fileRef = ref(storage, filePath);

  try {
    await getDownloadURL(fileRef);
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
};

export const deleteFile = async (fileName: string): Promise<void> => {
  const storageRef = ref(storage, fileName);
  await deleteObject(storageRef);
};

const storageService = {
  uploadFile,
  downloadFile,
  deleteFile,
  checkIfFileExists,
};

export default storageService;
