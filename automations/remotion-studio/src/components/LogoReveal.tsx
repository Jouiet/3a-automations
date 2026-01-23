/**
 * LogoReveal Component - Animated logo entrance
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  spring,
} from 'remotion';

interface LogoRevealProps {
  logoSrc: string;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ logoSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scale animation with spring physics
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // Rotation for dramatic effect
  const rotation = interpolate(
    frame,
    [0, 20],
    [-180, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Glow intensity
  const glowIntensity = interpolate(
    frame,
    [0, 30, 60],
    [0, 1, 0.5],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Fade out at the end
  const opacity = interpolate(
    frame,
    [0, 10, fps * 2.5, fps * 3],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(99,102,241,${glowIntensity * 0.5}) 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <Img
        src={logoSrc}
        style={{
          width: 200,
          height: 200,
          objectFit: 'contain',
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          filter: `drop-shadow(0 0 ${30 * glowIntensity}px rgba(99,102,241,${glowIntensity}))`,
        }}
      />
    </AbsoluteFill>
  );
};
