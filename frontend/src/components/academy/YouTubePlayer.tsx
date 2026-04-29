"use client";

import React, { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import apiClient from "@/lib/api-client";

interface YouTubePlayerProps {
  videoUrl: string;
  contentId: string;
  initialPosition?: number;
  onStateChange?: (state: number) => void;
  onProgressUpdate?: (percentage: number) => void;
}

const SYNC_INTERVAL_MS = 5000;

export default function YouTubePlayer({
  videoUrl,
  contentId,
  initialPosition = 0,
  onProgressUpdate,
}: YouTubePlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const shortsMatch = url.match(/youtube\.com\/shorts\/([0-9A-Za-z_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    const standardMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|v\/|embed\/|u\/\w\/))([0-9A-Za-z_-]{11})/
    );
    if (standardMatch) return standardMatch[1];
    return null;
  };

  const videoId = getYouTubeId(videoUrl);

  const syncProgress = async (player: Plyr, forceComplete = false) => {
    if (!player) return;
    
    const currentTime = player.currentTime;
    const duration = player.duration;
    if (!duration || duration <= 0) return;

    const percentage = forceComplete ? 100 : (currentTime / duration) * 100;
    const position = forceComplete ? duration : currentTime;

    if (onProgressUpdate) onProgressUpdate(percentage);

    try {
      await apiClient.post("/progress/watch", {
        content_id: contentId,
        completion_percentage: percentage,
        last_position_seconds: position,
      });
    } catch (error) {
      console.error("Failed to sync watch progress:", error);
    }
  };

  const startPolling = (player: Plyr) => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      syncProgress(player);
    }, SYNC_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!videoId || !videoRef.current) return;

    // Initialize Native Plyr
    const player = new Plyr(videoRef.current, {
      autoplay: false,
      controls: [
        "play-large", "play", "progress", "current-time", 
        "mute", "volume", "captions", "settings", "fullscreen"
      ],
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        origin: window.location.origin
      }
    });

    playerRef.current = player;

    // Event Listeners
    player.on("ready", () => {
      if (initialPosition > 0) {
        player.currentTime = initialPosition;
      }
    });

    player.on("play", () => startPolling(player));
    player.on("pause", () => stopPolling());
    player.on("ended", () => {
      stopPolling();
      syncProgress(player, true);
    });

    // Cleanup
    return () => {
      stopPolling();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]); // Re-init if videoId changes

  if (!videoId) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-surface text-foreground/50 rounded-2xl">
        Geçersiz YouTube Linki
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Target for Plyr */}
      <div
        ref={videoRef}
        data-plyr-provider="youtube"
        data-plyr-embed-id={videoId}
      />
      
      {/* Security Overlays */}
      <div className="absolute top-0 left-0 w-full h-[60px] z-10 bg-transparent pointer-events-auto" />
      <div className="absolute bottom-0 right-0 w-[100px] h-[50px] z-10 bg-transparent pointer-events-auto" />
    </div>
  );
}
