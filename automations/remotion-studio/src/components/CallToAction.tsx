/**
 * CallToAction Component - End screen with CTA
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface CallToActionProps {
  text: string;
  buttonText: string;
  url: string;
  primaryColor: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  text,
  buttonText,
  url,
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text animation
  const textOpacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const textY = interpolate(
    frame,
    [0, 20],
    [-30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Button animation (delayed)
  const buttonScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200 },
  });

  // Pulse effect
  const pulse = 1 + Math.sin(frame * 0.15) * 0.03;

  // URL fade in
  const urlOpacity = interpolate(
    frame,
    [40, 60],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      {/* Main text */}
      <h2
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          margin: 0,
        }}
      >
        {text}
      </h2>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${Math.max(0, buttonScale) * pulse})`,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          padding: '24px 64px',
          borderRadius: 16,
          boxShadow: `0 10px 40px ${primaryColor}60`,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          {buttonText}
        </span>
      </div>

      {/* URL */}
      <p
        style={{
          fontSize: 24,
          color: 'rgba(255,255,255,0.7)',
          opacity: urlOpacity,
          margin: 0,
        }}
      >
        {url}
      </p>
    </AbsoluteFill>
  );
};
