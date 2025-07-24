import * as FileSystem from 'expo-file-system';

export const getAudioPaths = ({
  userId,
  fileName,
}: {
  userId: string;
  fileName: string;
}) => {
  const remotePath = `users/${userId}/prayers/${fileName}`; // Firebase Storage path
  const localPath = `flock/recordings/${fileName}`; // Local device path

  return {
    remotePath,
    localPath,
  };
};

export function resolveAudioUri(
  audioLocalPath?: string,
  recordingUri?: string,
  remoteAudioUri?: string,
): string {
  console.log('🔊 resolveAudioUri', { audioLocalPath, recordingUri });
  if (audioLocalPath) return FileSystem.documentDirectory + audioLocalPath;
  if (recordingUri) return recordingUri;
  if (remoteAudioUri) return remoteAudioUri;
  return '';
}
