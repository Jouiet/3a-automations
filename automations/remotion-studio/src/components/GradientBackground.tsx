/**
 * GradientBackground Component - Animated gradient background
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

interface GradientBackgroundProps {
  primaryColor: string;
  secondaryColor: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  primaryColor,
  secondaryColor,
}) => {
  const frame = useCurrentFrame();

  // Animate gradient angle
  const angle = interpolate(
    frame,
    [0, 900],
    [135, 225],
    { extrapolateRight: 'extend' }
  );

  // Subtle movement effect
  const offsetX = Math.sin(frame * 0.02) * 10;
  const offsetY = Math.cos(frame * 0.02) * 10;

  return (
    <AbsoluteFill>
      {/* Base gradient */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(${angle}deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      />

      {/* Floating orb 1 */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          top: `${20 + offsetY}%`,
          left: `${-10 + offsetX}%`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* Floating orb 2 */}
      <div
        style={{
          position: 'absolute',
          width: '50%',
          height: '50%',
          bottom: `${10 - offsetY}%`,
          right: `${-5 - offsetX}%`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${secondaryColor}50 0%, transparent 70%)`,
          filter: 'blur(50px)',
        }}
      />

      {/* Noise overlay for texture */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </AbsoluteFill>
  );
};
