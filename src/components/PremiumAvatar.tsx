import React, { useEffect, useRef, useState, useId, useMemo, useCallback } from 'react';
import {
  squircleShape,
  silhouetteToSvgPath,
  generateEyePath,
  EXPRESSIONS_MAP,
  STATES_MAP,
  BEHAVIOR_CONFIGS,
  AgentBehaviorState,
  BotExpression,
  BotState,
  BotPose,
  BotAnimationTrack,
  BotKeyframe,
  sampleTrack,
  TAU
} from '../bot';

export type AvatarStatus = 'idle' | 'waiting' | 'listening' | 'thinking' | 'analyzing' | 'speaking' | 'success' | 'error';

export interface PremiumAvatarProps {
  status?: AvatarStatus;
  behaviorState?: AgentBehaviorState;
  expression?: string;
  animState?: string;
  animationTrack?: BotAnimationTrack;
  className?: string;
  size?: number | string;
  accentColor?: string;
  isAnimated?: boolean;
  interactive?: boolean;
  showStatusBadge?: boolean;
  onClick?: () => void;
}

export const PremiumAvatar: React.FC<PremiumAvatarProps> = ({
  status = 'idle',
  behaviorState,
  expression: forcedExpressionId,
  animState: forcedAnimStateId,
  animationTrack,
  className = 'w-8 h-8',
  accentColor = 'var(--accent)',
  isAnimated = true,
  interactive = false,
  showStatusBadge = false,
  onClick
}) => {
  const rawId = useId();
  const maskId = `bot-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const glowId = `bot-glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rimId = `bot-rim-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [interactiveExpr, setInteractiveExpr] = useState<string | null>(null);
  const [mouseGaze, setMouseGaze] = useState<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const animRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const blinkStateRef = useRef<{ isBlinking: boolean; blinkProgress: number; nextBlinkTime: number }>({
    isBlinking: false,
    blinkProgress: 1,
    nextBlinkTime: Date.now() + 2500 + Math.random() * 2000
  });

  // Effective behavioral preset configuration
  const currentBehavior = useMemo(() => {
    const key = (behaviorState || status) as AgentBehaviorState;
    return BEHAVIOR_CONFIGS[key] || BEHAVIOR_CONFIGS.idle;
  }, [behaviorState, status]);

  // Determine active animation state
  const effectiveStateId = useMemo(() => {
    if (forcedAnimStateId && STATES_MAP.has(forcedAnimStateId)) return forcedAnimStateId;
    return currentBehavior.animStateId;
  }, [forcedAnimStateId, currentBehavior]);

  // Determine active expression
  const effectiveExpressionId = useMemo(() => {
    if (interactiveExpr && EXPRESSIONS_MAP.has(interactiveExpr)) return interactiveExpr;
    if (forcedExpressionId && EXPRESSIONS_MAP.has(forcedExpressionId)) return forcedExpressionId;
    return currentBehavior.expressionId;
  }, [interactiveExpr, forcedExpressionId, currentBehavior]);

  const currentState: BotState = useMemo(() => {
    return STATES_MAP.get(effectiveStateId) || STATES_MAP.get('float')!;
  }, [effectiveStateId]);

  const currentExpr: BotExpression = useMemo(() => {
    return EXPRESSIONS_MAP.get(effectiveExpressionId) || EXPRESSIONS_MAP.get('neutre')!;
  }, [effectiveExpressionId]);

  // Handle Mouse movement for interactive gaze tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive && !isHovered) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    setMouseGaze({
      yaw: Math.max(-1, Math.min(1, deltaX)) * 24,
      pitch: Math.max(-1, Math.min(1, deltaY)) * 18
    });
  }, [interactive, isHovered]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMouseGaze({ yaw: 0, pitch: 0 });
  }, []);

  // 60FPS High-fidelity Animation loop with procedural life mechanics
  useEffect(() => {
    if (!isAnimated) return;

    startTimeRef.current = Date.now();
    blinkStateRef.current.nextBlinkTime = Date.now() + 2000 + Math.random() * 2500;

    const loop = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedSec(elapsed);

      const duration = animationTrack?.duration || currentState.duration || 2.5;
      const normalizedT = (elapsed % duration) / duration;
      setT(normalizedT);

      // Procedural natural blinking cycle
      const blink = blinkStateRef.current;
      if (!blink.isBlinking && now >= blink.nextBlinkTime) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
      }

      if (blink.isBlinking) {
        blink.blinkProgress += 0.09; // fast blink duration (~140ms)
        if (blink.blinkProgress >= 1) {
          blink.isBlinking = false;
          blink.blinkProgress = 1;
          blink.nextBlinkTime = now + 3000 + Math.random() * 3000;
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAnimated, currentState.duration, animationTrack?.duration]);

  // Sample Keyframe if animation track provided
  const activeKeyframe: BotKeyframe | null = useMemo(() => {
    if (!animationTrack) return null;
    return sampleTrack(animationTrack, elapsedSec);
  }, [animationTrack, elapsedSec]);

  // Compute organic posture with micro-breathing & gaze physics
  const pose: BotPose = useMemo(() => {
    const rawPose = currentState.pose(t);

    // Natural subtle breathing wave
    const breath = Math.sin(elapsedSec * 2.2) * 0.025;
    const wanderX = Math.sin(elapsedSec * 0.8) * 3;
    const wanderY = Math.cos(elapsedSec * 0.6) * 2;

    // Gaze synthesis (expression + animation pose + mouse track + micro wander)
    const gaze = {
      yaw: (rawPose.gaze?.yaw ?? 0) + (currentExpr.gaze?.yaw ?? 0) + mouseGaze.yaw + wanderX,
      pitch: (rawPose.gaze?.pitch ?? 0) + (currentExpr.gaze?.pitch ?? 0) + mouseGaze.pitch + wanderY,
      roll: (rawPose.gaze?.roll ?? 0) + (currentExpr.gaze?.roll ?? 0)
    };

    const split = (rawPose.split ?? currentExpr.split ?? 17) * 2.2;
    const sil = {
      ...rawPose.sil,
      scale: (rawPose.sil?.scale ?? 1) * (1 + breath)
    };

    const dots = rawPose.dots || [];

    // Calculate natural blink multiplier
    const blinkProgress = blinkStateRef.current.blinkProgress;
    let blinkMultiplier = 1;
    if (blinkStateRef.current.isBlinking) {
      // parabolic close-then-open curve
      blinkMultiplier = Math.max(0.08, Math.abs(Math.sin(blinkProgress * Math.PI - Math.PI / 2)));
    }

    // Speaking soundwave flutter
    let speakingFlutter = 1;
    if (status === 'speaking' || behaviorState === 'speaking') {
      speakingFlutter = 0.85 + 0.3 * Math.abs(Math.sin(elapsedSec * 14));
    }

    // Process eyes
    const baseEyes = rawPose.eyes || currentExpr.eyes || [];
    const eyes = baseEyes.map((eyeData) => ({
      ...eyeData,
      openness: (eyeData.openness ?? 1) * blinkMultiplier * (status === 'speaking' ? speakingFlutter : 1)
    }));

    return { sil, gaze, split, eyes, dots };
  }, [currentState, currentExpr, t, elapsedSec, mouseGaze, status, behaviorState]);

  // Silhouette SVG path calculation using Squircle superellipse (order 4.2)
  const bodyPath = useMemo(() => {
    if (activeKeyframe && activeKeyframe.bodyPath) {
      return activeKeyframe.bodyPath;
    }
    return silhouetteToSvgPath(pose.sil, squircleShape.radii, 88);
  }, [activeKeyframe, pose.sil]);

  // Calculate eye paths with 3D Gaze offset, Rotation and Symmetrical split
  const eyeElements = useMemo(() => {
    if (activeKeyframe && activeKeyframe.eyes && activeKeyframe.eyes.length > 0) {
      return activeKeyframe.eyes.map(eye => ({
        d: eye.d,
        transform: eye.matrix ? (eye.matrix.startsWith('matrix') ? eye.matrix : `matrix(${eye.matrix})`) : (eye.transform || ''),
        alpha: eye.alpha ?? 1
      }));
    }

    if (!pose.eyes || pose.eyes.length === 0) return [];
    const gazeX = ((pose.gaze?.yaw ?? 0) / 100) * 28;
    const gazeY = ((pose.gaze?.pitch ?? 0) / 100) * 24;
    const roll = pose.gaze?.roll ?? 0;
    const splitOffset = pose.split ?? 36;

    return pose.eyes.map((eyeData, index) => {
      const isLeft = index === 0 && pose.eyes!.length > 1;
      const eyeBaseX = isLeft ? -splitOffset / 2 : splitOffset / 2;
      const eyeX = eyeBaseX + gazeX;
      const eyeY = gazeY;

      const eyeGeom = generateEyePath(
        {
          ...eyeData,
          rot: (eyeData.rot ?? 0) + roll
        },
        eyeX,
        eyeY,
        82
      );

      return {
        ...eyeGeom,
        alpha: eyeData.openness ?? 1
      };
    });
  }, [activeKeyframe, pose.eyes, pose.gaze, pose.split]);

  // Container styling and glow effects based on active behavior
  const getContainerGlow = () => {
    switch (currentBehavior.state) {
      case 'thinking':
        return 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-500/70 ring-1 ring-purple-500/30';
      case 'analyzing':
        return 'shadow-[0_0_22px_rgba(6,182,212,0.55)] border-cyan-500/70 ring-1 ring-cyan-500/30';
      case 'speaking':
        return 'shadow-[0_0_22px_var(--accent-light,rgba(59,130,246,0.6))] border-[var(--accent)] ring-2 ring-[var(--accent)]/40';
      case 'success':
        return 'shadow-[0_0_22px_rgba(16,185,129,0.55)] border-emerald-500/70 ring-1 ring-emerald-500/30';
      case 'error':
        return 'shadow-[0_0_22px_rgba(244,63,94,0.6)] border-rose-500/80 ring-2 ring-rose-500/40 animate-pulse';
      case 'listening':
        return 'shadow-[0_0_16px_rgba(56,189,248,0.45)] border-sky-400/60 ring-1 ring-sky-400/25';
      case 'waiting':
      case 'idle':
      default:
        return 'border-[#27272a] hover:border-[var(--accent)]/60 shadow-[0_0_14px_rgba(0,0,0,0.4)]';
    }
  };

  const handleContainerClick = () => {
    if (interactive) {
      const funList = ['joie', 'curieux', 'clin', 'coquin', 'inspire', 'amour', 'zen', 'robot', 'vision'];
      const nextIdx = Math.floor(Math.random() * funList.length);
      setInteractiveExpr(funList[nextIdx]);
      setTimeout(() => setInteractiveExpr(null), 3000);
    }
    if (onClick) onClick();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl bg-gradient-to-br from-[#1c1c20] via-[#121215] to-[#08080a] border ${getContainerGlow()} flex items-center justify-center select-none shrink-0 transition-all duration-300 overflow-hidden ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      title={`${currentBehavior.labelAr} (${currentBehavior.labelEn}) - ${currentBehavior.descriptionAr}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-158 -158 316 316"
        role="img"
        aria-label="GBG AI Superellipse Squircle Bot"
        className="w-full h-full p-0.5 drop-shadow-md transition-transform duration-150"
      >
        <defs>
          {/* Ambient Glow Gradient */}
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={currentBehavior.glowColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={currentBehavior.glowColor} stopOpacity="0" />
          </radialGradient>

          {/* Rim light gradient */}
          <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" stopOpacity="0.05" />
            <stop offset="100%" stopColor={currentBehavior.glowColor} stopOpacity="0.3" />
          </linearGradient>

          {/* Mask to carve the eyes out of the Squircle superellipse body */}
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-158" y="-158" width="316" height="316">
            {/* White Squircle body area */}
            <path d={bodyPath} fill="#ffffff" />

            {/* Cutout eye holes */}
            {eyeElements.map((eyeItem, idx) => (
              <path
                key={idx}
                d={eyeItem.d}
                transform={eyeItem.transform}
                fill="#000000"
              />
            ))}
          </mask>
        </defs>

        <g>
          {/* Ambient Glow */}
          <circle cx="0" cy="0" r="115" fill={`url(#${glowId})`} opacity="0.65" />

          {/* Dynamic particle dots for bloom/analyzing states */}
          {pose.dots &&
            pose.dots.map((dot, i) => (
              <circle
                key={i}
                cx={(dot.x * 72).toFixed(1)}
                cy={(dot.y * 72).toFixed(1)}
                r={(dot.r * 72).toFixed(1)}
                fill={currentBehavior.glowColor}
                opacity={dot.opacity}
              />
            ))}

          {/* Eye Light Underlay Layer */}
          <path
            d={bodyPath}
            fill={currentBehavior.eyeColor}
            className="transition-colors duration-300"
          />

          {/* Squircle Superellipse Body with Eye Mask */}
          <g mask={`url(#${maskId})`}>
            <rect
              x="-158"
              y="-158"
              width="316"
              height="316"
              fill={currentBehavior.bodyFill}
              className="transition-colors duration-300"
            />

            {/* Internal Squircle contour rim light */}
            <path
              d={bodyPath}
              fill="none"
              stroke={`url(#${rimId})`}
              strokeWidth="2.8"
            />
          </g>

          {/* Outer Border Stroke */}
          <path
            d={bodyPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.6"
          />
        </g>
      </svg>

      {/* Optional Status Pill Badge */}
      {showStatusBadge && (
        <span
          className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[#121215] ${
            currentBehavior.state === 'speaking'
              ? 'bg-[var(--accent)] animate-ping'
              : currentBehavior.state === 'thinking'
              ? 'bg-purple-500 animate-pulse'
              : currentBehavior.state === 'analyzing'
              ? 'bg-cyan-400 animate-pulse'
              : currentBehavior.state === 'error'
              ? 'bg-rose-500'
              : currentBehavior.state === 'success'
              ? 'bg-emerald-400'
              : 'bg-emerald-500'
          }`}
        />
      )}
    </div>
  );
};
