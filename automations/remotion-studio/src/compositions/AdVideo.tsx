/**
 * AdVideo Composition - Short Social Media Ad
 * Optimized for Instagram Reels, TikTok, YouTube Shorts
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img,
  interpolate,
  spring,
} from 'remotion';

import { LogoReveal } from '../components/LogoReveal';
import { GradientBackground } from '../components/GradientBackground';

interface AdVideoProps {
  headline: string;
  cta: string;
  logoSrc: string;
}

export const AdVideo: React.FC<AdVideoProps> = ({
  headline,
  cta,
  logoSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animations
  const headlineScale = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 200 },
  });

  const ctaOpacity = interpolate(
    frame,
    [10 * fps, 11 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ctaY = interpolate(
    frame,
    [10 * fps, 11 * fps],
    [50, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Pulse animation for CTA
  const pulse = Math.sin(frame * 0.1) * 5 + 100;

  return (
    <AbsoluteFill>
      {/* Dynamic gradient */}
      <GradientBackground
        primaryColor="#6366f1"
        secondaryColor="#0f172a"
      />

      {/* Logo (0-3s) */}
      <Sequence from={0} durationInFrames={3 * fps}>
        <LogoReveal logoSrc={logoSrc} />
      </Sequence>

      {/* Headline (3-10s) */}
      <Sequence from={2 * fps} durationInFrames={13 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10%',
          }}
        >
          <h1
            style={{
              fontSize: width > 1080 ? 80 : 60,
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              transform: `scale(${headlineScale})`,
              lineHeight: 1.2,
            }}
          >
            {headline}
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* CTA Button (10-15s) */}
      <Sequence from={10 * fps} durationInFrames={5 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: height * 0.15,
          }}
        >
          <div
            style={{
              opacity: ctaOpacity,
              transform: `translateY(${ctaY}px) scale(${pulse / 100})`,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              padding: '20px 60px',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4)',
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              {cta}
            </span>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
