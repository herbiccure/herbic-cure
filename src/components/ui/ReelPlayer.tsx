'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer to prevent SSR hydration mismatches
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-stone-950 animate-pulse" />,
});

export interface VideoSourceInfo {
  type: 'gdrive' | 'youtube' | 'vimeo' | 'instagram' | 'direct' | 'unknown';
  fileId?: string;
  embedUrl?: string;
  directStreamUrl?: string;
  cleanUrl: string;
}

/**
 * Robust parser to identify and normalize various video URLs:
 * - Google Drive share links, preview links, open?id= links
 * - YouTube shorts (youtube.com/shorts/xxx), watch?v=xxx, youtu.be/xxx
 * - Instagram reels (instagram.com/reel/xxx or /p/xxx)
 * - Vimeo links
 * - Direct files (mp4, webm, Cloudinary, local /uploads/...)
 */
export function parseVideoSource(url: string | null | undefined): VideoSourceInfo | null {
  if (!url) return null;
  const clean = url.trim();
  if (!clean) return null;

  // 1. Google Drive & Google Docs (all share, preview, uc, and view links)
  const driveFileRegex = /(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const driveParamRegex = /(?:drive|docs)\.google\.com\/(?:open|uc|download)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i;
  const driveUsercontentRegex = /drive\.usercontent\.google\.com\/download\?[^#]*\bid=([a-zA-Z0-9_-]+)/i;
  const driveMatch = clean.match(driveFileRegex) || clean.match(driveParamRegex) || clean.match(driveUsercontentRegex);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'gdrive',
      fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      cleanUrl: clean,
    };
  }

  // 2. YouTube & YouTube Shorts
  const ytRegex = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = clean.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      fileId: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&playsinline=1&controls=0&modestbranding=1&rel=0`,
      cleanUrl: clean,
    };
  }

  // 3. Instagram Reels & Posts
  const igRegex = /instagram\.com\/(?:[a-zA-Z0-9_.]+\/)?(?:reel|p)\/([a-zA-Z0-9_-]+)/i;
  const igMatch = clean.match(igRegex);
  if (igMatch && igMatch[1]) {
    return {
      type: 'instagram',
      fileId: igMatch[1],
      embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/`,
      cleanUrl: clean,
    };
  }

  // 4. Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?([0-9]+)/i;
  const vimeoMatch = clean.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      fileId: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&autopause=0`,
      cleanUrl: clean,
    };
  }

  // 5. Direct video files or other streaming URLs
  return {
    type: 'direct',
    cleanUrl: clean,
  };
}

interface ReelPlayerProps {
  url: string | null | undefined;
  thumbnailUrl?: string;
  playing?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
  onEnded?: () => void;
  onError?: () => void;
  playsInline?: boolean;
}

export default function ReelPlayer({
  url,
  thumbnailUrl,
  playing = true,
  muted = true,
  controls = false,
  loop = true,
  className = 'w-full h-full object-cover',
  onEnded,
  onError,
  playsInline = true,
}: ReelPlayerProps) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoInfo = parseVideoSource(url);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Programmatic autoplay enforcement for HTML5 direct videos
  useEffect(() => {
    if (!videoRef.current || videoInfo?.type !== 'direct') return;
    const v = videoRef.current;

    // Browser autoplay policy requires DOM property muted = true
    if (muted) {
      v.defaultMuted = true;
      v.muted = true;
    }
    v.playsInline = playsInline;

    if (playing) {
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if browser blocks unmuted playback
          if (!v.muted) {
            v.muted = true;
            v.play().catch(() => {});
          }
        });
      }
    } else {
      v.pause();
    }
  }, [playing, muted, playsInline, url, videoInfo?.type]);

  if (!url || !videoInfo) {
    return null;
  }

  // Fallback to thumbnail on error
  if (hasError) {
    return null;
  }

  // Type 1: Google Drive (Official Embedded Preview Player in IFrame)
  if (videoInfo.type === 'gdrive' && videoInfo.embedUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <iframe
          src={videoInfo.embedUrl}
          title="Google Drive Video Player"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className={`w-full h-full border-0 absolute inset-0 object-cover ${
            controls ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        />
      </div>
    );
  }

  // Type 2: Instagram Reel Embed
  if (videoInfo.type === 'instagram' && videoInfo.embedUrl) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <iframe
          src={videoInfo.embedUrl}
          title="Instagram Reel Player"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0 object-cover pointer-events-auto"
        />
      </div>
    );
  }

  // Type 3 & 4: YouTube / Shorts or Vimeo
  if (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo') {
    if (!mounted) {
      return <div className="w-full h-full bg-stone-950 animate-pulse" />;
    }

    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-black ${
          controls ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <ReactPlayer
          src={videoInfo.cleanUrl}
          playing={playing}
          muted={muted}
          controls={controls}
          loop={loop}
          playsInline={playsInline}
          width="100%"
          height="100%"
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          onEnded={onEnded}
          config={{
            youtube: {
              disablekb: controls ? 0 : 1,
            },
            vimeo: {
              autopause: false,
              background: !controls,
            },
          }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>
    );
  }

  // Type 4: Direct MP4 / WebM / Cloudinary video file
  // Safety guard: never pass Google Drive / Docs URLs to an HTML5 <video> tag
  if (
    videoInfo.cleanUrl.includes('drive.google.com') ||
    videoInfo.cleanUrl.includes('docs.google.com') ||
    videoInfo.cleanUrl.includes('googleusercontent.com')
  ) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      src={videoInfo.cleanUrl}
      poster={thumbnailUrl}
      autoPlay={playing}
      muted={muted}
      loop={loop}
      controls={controls}
      playsInline={playsInline}
      preload="metadata"
      onError={() => {
        setHasError(true);
        onError?.();
      }}
      onEnded={onEnded}
      className={className}
    />
  );
}
