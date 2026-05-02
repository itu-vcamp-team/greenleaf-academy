"use client";

import React, { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";
// Import CSS module for global Plyr overrides (green fullscreen btn, vertical mode)
import plyrStyles from "./YouTubePlayer.module.css"; // eslint-disable-line @typescript-eslint/no-unused-vars
import apiClient from "@/lib/api-client";

// NOTE: Plyr is a browser-only library. We import it dynamically inside useEffect
// to prevent Next.js SSR from evaluating it on the server (which would cause
// "TypeError: r is not a constructor" because Plyr's ESM bundle has no SSR constructor).

interface YouTubePlayerProps {
  videoUrl: string;
  contentId: string;
  initialPosition?: number;
  onStateChange?: (state: number) => void;
  onProgressUpdate?: (percentage: number) => void;
  /** vertical=true: fills a 9:16 phone-mock container (Shorts player) */
  vertical?: boolean;
}

const SYNC_INTERVAL_MS = 5000;

export default function YouTubePlayer({
  videoUrl,
  contentId,
  initialPosition = 0,
  onProgressUpdate,
  vertical = false,
}: YouTubePlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syncProgress = async (player: any, forceComplete = false) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startPolling = (player: any) => {
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

    let destroyed = false;

    // Dynamic import keeps Plyr out of the SSR bundle entirely.
    // This is the correct pattern for browser-only libraries in Next.js.
    import("plyr").then((PlyrModule) => {
      if (destroyed || !videoRef.current) return;

      // plyr publishes both CJS and ESM; the constructor may be the default export
      // or the module itself depending on the bundler resolution.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PlyrConstructor = (PlyrModule as any).default ?? PlyrModule;

      const player = new PlyrConstructor(videoRef.current, {
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
    });

    return () => {
      destroyed = true;
      stopPolling();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
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
    <div
      className="relative w-full h-full bg-black overflow-hidden select-none"
      data-plyr-mode={vertical ? "vertical" : "horizontal"}
      // Prevent right-click context menu on the video container so the embedded
      // YouTube URL is not exposed. The YouTube iframe itself also has
      // pointer-events:none (see YouTubePlayer.module.css) so its internal links
      // are not reachable anyway.
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Target for Plyr — Plyr mounts its controls inside this element */}
      <div
        ref={videoRef}
        data-plyr-provider="youtube"
        data-plyr-embed-id={videoId}
      />
      {/*
        NOTE: We deliberately do NOT render transparent pointer-capturing overlay
        divs here. Any sibling div with pointer-events active would intercept
        mousemove/mouseenter on the area it covers, causing Plyr to emit a
        "mouseleave" on its own container and immediately hide the control bar
        (fullscreen, settings, fast-forward, etc.). Context-menu prevention via
        onContextMenu is sufficient since the iframe already has pointer-events:none.
      */}
    </div>
  );
}
