/**
 * FeatureCard Component - Animated feature showcase
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  accentColor,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance animation
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const cardOpacity = interpolate(
    frame,
    [0, 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Icon bounce
  const iconY = interpolate(
    frame,
    [0, 10, 20, 30],
    [0, -20, 0, -10],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Subtle float animation
  const floatY = Math.sin(frame * 0.05) * 5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity: cardOpacity,
          transform: `scale(${cardScale}) translateY(${floatY}px)`,
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          border: `2px solid ${accentColor}40`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${accentColor}20`,
          minWidth: 500,
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: 80,
            transform: `translateY(${iconY}px)`,
          }}
        >
          {icon}
        </span>

        {/* Title */}
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.8)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {description}
        </p>

        {/* Progress indicator */}
        <div
          style={{
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            marginTop: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, (frame / fps) * 25)}%`,
              height: '100%',
              backgroundColor: accentColor,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
