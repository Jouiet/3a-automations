/**
 * MyDealzAd Composition - Fashion E-commerce
 * Optimized for Instagram Reels, TikTok, YouTube Shorts
 * Brand: Trendy, dynamic, youthful fashion aesthetic
 *
 * NOTE: MyDealz store currently HTTP 402 (Payment Required)
 * This composition is prepared for when the store becomes active.
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

interface MyDealzAdProps {
  headline: string;
  subheadline?: string;
  cta: string;
  logoSrc?: string;
  productImageSrc?: string;
  discountBadge?: string;
  flashSale?: boolean;
}

export const MyDealzAd: React.FC<MyDealzAdProps> = ({
  headline,
  subheadline = 'Mode & Tendances',
  cta,
  logoSrc,
  productImageSrc,
  discountBadge,
  flashSale = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // MyDealz brand colors - Fashion/trendy palette
  const brandPrimary = '#ec4899'; // Fashion pink
  const brandSecondary = '#1e1b4b'; // Deep purple
  const brandAccent = '#fbbf24'; // Warm gold/yellow
  const brandFlash = '#ef4444'; // Flash sale red

  // Animations
  const headlineScale = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 180, stiffness: 120 },
  });

  const subheadlineSlide = interpolate(
    frame,
    [3 * fps, 4 * fps],
    [-50, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const subheadlineOpacity = interpolate(
    frame,
    [3 * fps, 4 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const productScale = spring({
    frame: frame - 4 * fps,
    fps,
    config: { damping: 120, stiffness: 80 },
  });

  const productRotate = interpolate(
    frame,
    [4 * fps, 5 * fps],
    [-5, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Discount badge bounce
  const badgeBounce = spring({
    frame: frame - 5 * fps,
    fps,
    config: { damping: 100, stiffness: 150 },
  });

  // Flash sale urgency pulse
  const flashPulse = flashSale ? Math.sin(frame * 0.15) * 0.1 + 1 : 1;

  const ctaOpacity = interpolate(
    frame,
    [10 * fps, 11 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ctaY = interpolate(
    frame,
    [10 * fps, 11 * fps],
    [40, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // CTA bounce pulse
  const ctaPulse = Math.sin(frame * 0.1) * 4 + 100;

  return (
    <AbsoluteFill>
      {/* Dynamic fashion gradient */}
      <GradientBackground
        primaryColor={flashSale ? brandFlash : brandPrimary}
        secondaryColor={brandSecondary}
      />

      {/* Subtle pattern overlay - fashion vibe */}
      <AbsoluteFill
        style={{
          background: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.03) 50%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.03) 50%, transparent 52%)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Flash Sale Banner (0-15s if flashSale) */}
      {flashSale && (
        <AbsoluteFill
          style={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 20,
          }}
        >
          <div
            style={{
              background: brandFlash,
              padding: '8px 30px',
              borderRadius: 4,
              transform: `scale(${flashPulse})`,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              ⚡ FLASH SALE ⚡
            </span>
          </div>
        </AbsoluteFill>
      )}

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
            paddingTop: flashSale ? height * 0.18 : height * 0.12,
          }}
        >
          <h1
            style={{
              fontSize: width > 1080 ? 72 : 54,
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              transform: `scale(${headlineScale})`,
              lineHeight: 1.1,
              maxWidth: '90%',
              fontStyle: 'italic',
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              fontSize: width > 1080 ? 26 : 20,
              color: brandAccent,
              marginTop: 15,
              opacity: subheadlineOpacity,
              transform: `translateX(${subheadlineSlide}px)`,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 4,
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
                transform: `scale(${productScale}) rotate(${productRotate}deg)`,
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))',
                position: 'relative',
              }}
            >
              <Img
                src={productImageSrc}
                style={{
                  maxWidth: width * 0.55,
                  maxHeight: height * 0.45,
                  objectFit: 'contain',
                }}
              />

              {/* Discount Badge */}
              {discountBadge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    background: brandAccent,
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: `scale(${badgeBounce})`,
                    boxShadow: '0 5px 20px rgba(251, 191, 36, 0.5)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: brandSecondary,
                      textAlign: 'center',
                    }}
                  >
                    {discountBadge}
                  </span>
                </div>
              )}
            </div>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* CTA Button (10-15s) */}
      <Sequence from={10 * fps} durationInFrames={5 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: height * 0.1,
          }}
        >
          <div
            style={{
              opacity: ctaOpacity,
              transform: `translateY(${ctaY}px) scale(${ctaPulse / 100})`,
              background: `linear-gradient(135deg, ${brandAccent} 0%, #f59e0b 100%)`,
              padding: '20px 55px',
              borderRadius: 50,
              boxShadow: `0 10px 40px rgba(251, 191, 36, 0.5)`,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: brandSecondary,
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
