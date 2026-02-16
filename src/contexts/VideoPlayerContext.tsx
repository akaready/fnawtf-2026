'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Context for managing video player state across components
 * Enables communication between ReelPlayer and VideoDimmingOverlay
 */
interface VideoPlayerContextType {
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
  videoId: string | null;
  setVideoId: (id: string | null) => void;
  pauseVideo: (() => void) | null;
  setPauseVideo: (callback: (() => void) | null) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(
  undefined
);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [pauseVideo, setPauseVideo] = useState<(() => void) | null>(null);

  return (
    <VideoPlayerContext.Provider
      value={{
        isVideoPlaying,
        setIsVideoPlaying,
        videoId,
        setVideoId,
        pauseVideo,
        setPauseVideo,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

/**
 * Custom hook to access video player context
 * Must be used within a VideoPlayerProvider
 */
export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  }
  return context;
}
