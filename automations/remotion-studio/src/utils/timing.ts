/**
 * Timing Utilities for Remotion
 * Converts between seconds, frames, and timestamps
 */

/**
 * Convert seconds to frames
 */
export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}

/**
 * Convert frames to seconds
 */
export function framesToSeconds(frames: number, fps: number = 30): number {
  return frames / fps;
}

/**
 * Convert timestamp (MM:SS or MM:SS.mmm) to frames
 */
export function timestampToFrames(timestamp: string, fps: number = 30): number {
  const parts = timestamp.split(':');
  const minutes = parseInt(parts[0], 10);
  const secondsPart = parts[1].split('.');
  const seconds = parseInt(secondsPart[0], 10);
  const milliseconds = secondsPart[1] ? parseInt(secondsPart[1], 10) : 0;

  const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
  return secondsToFrames(totalSeconds, fps);
}

/**
 * Create a sequence timing object from start/end times
 */
export function createTiming(
  startSeconds: number,
  endSeconds: number,
  fps: number = 30
): { from: number; durationInFrames: number } {
  return {
    from: secondsToFrames(startSeconds, fps),
    durationInFrames: secondsToFrames(endSeconds - startSeconds, fps),
  };
}

/**
 * Create timings for a series of scenes
 */
export function createSceneTimings(
  scenes: Array<{ duration: number }>,
  fps: number = 30
): Array<{ from: number; durationInFrames: number }> {
  let currentFrame = 0;
  return scenes.map(scene => {
    const timing = {
      from: currentFrame,
      durationInFrames: secondsToFrames(scene.duration, fps),
    };
    currentFrame += timing.durationInFrames;
    return timing;
  });
}

/**
 * Calculate total duration from scenes
 */
export function getTotalDuration(
  scenes: Array<{ duration: number }>,
  fps: number = 30
): number {
  const totalSeconds = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  return secondsToFrames(totalSeconds, fps);
}

// Video presets
export const PRESETS = {
  landscape1080: { width: 1920, height: 1080, fps: 30 },
  landscape720: { width: 1280, height: 720, fps: 30 },
  square1080: { width: 1080, height: 1080, fps: 30 },
  portrait1080: { width: 1080, height: 1920, fps: 30 },
  shorts: { width: 1080, height: 1920, fps: 60 },
} as const;
