import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback } from 'react';
import { downloadFile } from './firebaseStorageService';

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  duration: number;
  position: number;
  isLoaded: boolean;
}

export interface AudioPlaybackActions {
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(position: number): void;
  replaceSource(src: string): void;
  unload(): void;
  fetchFromFirebase(src: string, toFilePath: string): Promise<void>;
}

export function useAudioPlaybackService(
  audioSource: string,
): AudioPlaybackState & AudioPlaybackActions {
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  const play = useCallback(() => {
    console.log('AudioPlaybackService play() called');
    try {
      if (status.currentTime === status.duration) {
        player.seekTo(0);
      }
      player.play();
    } catch (error) {
      console.error('AudioPlaybackService Error in play():', error);
    }
  }, [player, status.currentTime, status.duration]);

  const pause = useCallback(() => {
    console.log('AudioPlaybackService pause() called');
    try {
      player.pause();
    } catch (error) {
      console.error('AudioPlaybackService Error in pause():', error);
    }
  }, [player]);

  const stop = useCallback(() => {
    console.log('AudioPlaybackService stop() called');
    try {
      player.pause();
      player.seekTo(0);
    } catch (error) {
      console.error('AudioPlaybackService Error in stop():', error);
    }
  }, [player]);

  const seekTo = useCallback(
    (pos: number) => {
      console.log('AudioPlaybackService seekTo() called:', {
        position: pos,
      });
      try {
        player.seekTo(pos);
      } catch (error) {
        console.error('AudioPlaybackService Error in seekTo():', error);
      }
    },
    [player],
  );

  const replaceSource = useCallback(
    async (src: string) => {
      try {
        if (!player || !src) {
          console.warn('Player is not ready or src is invalid');
          return;
        }
        player.replace(src);
      } catch (error) {
        console.error('AudioPlaybackService Error in replaceSource():', error);
      }
    },
    [player],
  );

  const unload = useCallback(() => {
    console.log('AudioPlaybackService unload() called');
    try {
      player.remove();
    } catch (error) {
      console.error('AudioPlaybackService Error in unload():', error);
    }
  }, [player]);

  const fetchFromFirebase = useCallback(
    async (src: string, toFilePath: string) => {
      const audio = await downloadFile(src, toFilePath);
      replaceSource(audio);
    },
    [replaceSource],
  );

  return {
    // Direct pass-through of useAudioPlayerStatus fields
    isLoaded: status.isLoaded,
    duration: status.duration,
    position: status.currentTime,
    isPlaying: status.playing,
    isPaused: !status.playing && status.currentTime > 0,
    isStopped: !status.playing && status.currentTime === 0,
    // Actions
    play,
    pause,
    stop,
    seekTo,
    replaceSource,
    unload,
    fetchFromFirebase,
  };
}
