/**
 * AlphaMedicalAd Composition - Medical Equipment E-commerce
 * Optimized for Instagram, Facebook, YouTube
 * Brand: Professional, trustworthy, clean medical aesthetic
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
  staticFile,
} from 'remotion';

import { LogoReveal } from '../components/LogoReveal';
import { GradientBackground } from '../components/GradientBackground';

interface AlphaMedicalAdProps {
  headline: string;
  subheadline?: string;
  cta: string;
  logoSrc?: string;
  productImageSrc?: string;
  trustBadges?: string[];
}

export const AlphaMedicalAd: React.FC<AlphaMedicalAdProps> = ({
  headline,
  subheadline = 'Équipement médical professionnel',
  cta,
  logoSrc,
  productImageSrc,
  trustBadges = ['CE Certifié', 'Livraison 48h', 'SAV Expert'],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Alpha Medical brand colors
  const brandPrimary = '#0ea5e9'; // Medical blue
  const brandSecondary = '#0f172a'; // Dark navy
  const brandAccent = '#22c55e'; // Trust green

  // Animations
  const headlineScale = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 200 },
  });

  const subheadlineOpacity = interpolate(
    frame,
    [3 * fps, 4 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const productScale = spring({
    frame: frame - 4 * fps,
    fps,
    config: { damping: 150, stiffness: 100 },
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
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Trust badges stagger animation
  const badgeOpacity = (index: number) =>
    interpolate(
      frame,
      [6 * fps + index * 10, 7 * fps + index * 10],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

  // Subtle pulse for CTA
  const pulse = Math.sin(frame * 0.08) * 3 + 100;

  return (
    <AbsoluteFill>
      {/* Medical-themed gradient */}
      <GradientBackground
        primaryColor={brandPrimary}
        secondaryColor={brandSecondary}
      />

      {/* Subtle medical cross pattern overlay */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Logo (0-2s) */}
      <Sequence from={0} durationInFrames={3 * fps}>
        {logoSrc && <LogoReveal logoSrc={logoSrc} />}
      </Sequence>

      {/* Headline + Subheadline (2-10s) */}
      <Sequence from={2 * fps} durationInFrames={13 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: height * 0.15,
          }}
        >
          <h1
            style={{
              fontSize: width > 1080 ? 64 : 48,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transform: `scale(${headlineScale})`,
              lineHeight: 1.2,
              maxWidth: '85%',
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              fontSize: width > 1080 ? 28 : 22,
              color: 'rgba(255,255,255,0.9)',
              marginTop: 20,
              opacity: subheadlineOpacity,
              fontWeight: 500,
            }}
          >
            {subheadline}
          </p>
        </AbsoluteFill>
      </Sequence>

      {/* Product Image (4-12s) */}
      {productImageSrc && (
        <Sequence from={4 * fps} durationInFrames={11 * fps}>
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                transform: `scale(${productScale})`,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
              }}
            >
              <Img
                src={productImageSrc}
                style={{
                  maxWidth: width * 0.6,
                  maxHeight: height * 0.4,
                  objectFit: 'contain',
                }}
              />
            </div>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Trust Badges (6-12s) */}
      <Sequence from={6 * fps} durationInFrames={9 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: height * 0.45,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {trustBadges.map((badge, index) => (
              <div
                key={badge}
                style={{
                  opacity: badgeOpacity(index),
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    color: brandAccent,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'white',
                  }}
                >
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* CTA Button (10-15s) */}
      <Sequence from={10 * fps} durationInFrames={5 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: height * 0.12,
          }}
        >
          <div
            style={{
              opacity: ctaOpacity,
              transform: `translateY(${ctaY}px) scale(${pulse / 100})`,
              background: `linear-gradient(135deg, ${brandAccent} 0%, #16a34a 100%)`,
              padding: '18px 50px',
              borderRadius: 12,
              boxShadow: `0 10px 40px rgba(34, 197, 94, 0.4)`,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
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
