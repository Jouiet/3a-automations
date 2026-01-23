/**
 * TitleSlide Component - Animated title screen
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface TitleSlideProps {
  title: string;
  subtitle: string;
  primaryColor: string;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({
  title,
  subtitle,
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleY = interpolate(
    frame,
    [0, 15],
    [-50, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtitle animation (delayed)
  const subtitleOpacity = interpolate(
    frame,
    [15, 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const subtitleY = interpolate(
    frame,
    [15, 30],
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Underline animation
  const underlineWidth = interpolate(
    frame,
    [30, 50],
    [0, 200],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: 'white',
          textAlign: 'center',
          transform: `scale(${titleScale}) translateY(${titleY}px)`,
          textShadow: '0 4px 30px rgba(0,0,0,0.3)',
          margin: 0,
        }}
      >
        {title}
      </h1>

      {/* Animated underline */}
      <div
        style={{
          width: underlineWidth,
          height: 6,
          backgroundColor: primaryColor,
          borderRadius: 3,
        }}
      />

      {/* Subtitle */}
      <p
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
