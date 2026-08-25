import { BotKeyframe, BotAnimationTrack, BotKeyframeEye } from './types';

/**
 * Finds the active keyframe from an animation track for a given elapsed time in seconds.
 * Performs fast lookup and handles wrap-around looping.
 */
export function sampleTrack(track: BotAnimationTrack, elapsedSec: number): BotKeyframe | null {
  if (!track || !track.keyframes || track.keyframes.length === 0) return null;
  const duration = track.duration > 0 ? track.duration : (track.keyframes.length / (track.fps || 20));
  const normalizedTime = ((elapsedSec % duration) + duration) % duration;

  const keyframes = track.keyframes;
  
  // Direct frame index estimation if evenly spaced
  if (track.fps && track.totalFrames) {
    const frameIndex = Math.min(
      Math.floor(normalizedTime * track.fps),
      keyframes.length - 1
    );
    if (keyframes[frameIndex]) {
      return keyframes[frameIndex];
    }
  }

  // Binary search fallback for non-uniform timestamps
  let low = 0;
  let high = keyframes.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const kf = keyframes[mid];
    if (kf.time <= normalizedTime) {
      if (mid === keyframes.length - 1 || keyframes[mid + 1].time > normalizedTime) {
        return kf;
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return keyframes[0] || null;
}

/**
 * Creates a synthetic smooth keyframe track from procedural bot states if needed
 */
export function createSyntheticTrack(
  duration = 18.9,
  fps = 20,
  shape = 'squircle'
): BotAnimationTrack {
  const totalFrames = Math.floor(duration * fps);
  return {
    version: 1,
    fps,
    duration,
    totalFrames,
    viewBox: '-158 -158 316 316',
    shape,
    color: 'encre',
    keyframes: []
  };
}
