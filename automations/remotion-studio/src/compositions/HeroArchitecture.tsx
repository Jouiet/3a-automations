/**
 * HeroArchitecture.tsx - 3A Automation Homepage Hero Video
 * CINEMATIC VERSION with AI-Generated Images (Grok Aurora)
 *
 * Concept: "L'IA propose. Le code limite. L'humain décide."
 * Duration: 20 seconds (600 frames @ 30fps)
 * Format: 1920x1080 (16:9)
 *
 * Layers:
 * 1. Background: Neural network with Ken Burns effect
 * 2. Layer 1: AI Proposes - Creative chaos visualization
 * 3. Layer 2: Code Limits - Deterministic barriers
 * 4. Layer 3: Human Decides - Sovereign validation
 * 5. Stats: 121 | 22 | 100% reveal with glassmorphism
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from 'remotion';

// Brand colors
const COLORS = {
  primary: '#27CCFF',
  secondary: '#4A27CC',
  accent: '#FF27CC',
  dark: '#0a0a1a',
  light: '#ffffff',
};

// Ken Burns effect on images
const KenBurnsImage: React.FC<{
  src: string;
  startScale?: number;
  endScale?: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
}> = ({
  src,
  startScale = 1,
  endScale = 1.1,
  startX = 0,
  endX = 0,
  startY = 0,
  endY = 0,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(frame, [0, durationInFrames], [startScale, endScale], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    });

    const x = interpolate(frame, [0, durationInFrames], [startX, endX], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    });

    const y = interpolate(frame, [0, durationInFrames], [startY, endY], {
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    });

    return (
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x}%, ${y}%)`,
        }}
      />
    );
  };

// Cinematic text reveal with glow
const CinematicText: React.FC<{
  text: string;
  startFrame: number;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  uppercase?: boolean;
  letterSpacing?: number;
}> = ({
  text,
  startFrame,
  fontSize = 72,
  color = COLORS.light,
  glowColor = COLORS.primary,
  uppercase = false,
  letterSpacing = 0,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const progress = spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 50, stiffness: 100 },
    });

    const opacity = interpolate(frame - startFrame, [0, 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const blur = interpolate(frame - startFrame, [0, 15], [10, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const translateY = interpolate(progress, [0, 1], [40, 0]);

    return (
      <div
        style={{
          fontSize,
          fontWeight: 800,
          color,
          textShadow: `0 0 60px ${glowColor}, 0 0 120px ${glowColor}40`,
          transform: `translateY(${translateY}px)`,
          opacity,
          filter: `blur(${blur}px)`,
          textTransform: uppercase ? 'uppercase' : 'none',
          letterSpacing: `${letterSpacing}px`,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {text}
      </div>
    );
  };

// Subtitle text with subtle animation
const SubtitleText: React.FC<{
  text: string;
  startFrame: number;
  color?: string;
}> = ({ text, startFrame, color = COLORS.primary }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - startFrame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontSize: 24,
        fontWeight: 500,
        color,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        opacity,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {text}
    </div>
  );
};

// Glassmorphism panel
const GlassPanel: React.FC<{
  children: React.ReactNode;
  opacity?: number;
}> = ({ children, opacity = 1 }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '50px 80px',
      opacity,
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    }}
  >
    {children}
  </div>
);

// Animated stat counter
const StatCounter: React.FC<{
  value: number;
  suffix?: string;
  label: string;
  startFrame: number;
}> = ({ value, suffix = '', label, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 50, stiffness: 80 },
  });

  const displayValue = Math.round(value * progress);

  const opacity = interpolate(frame - startFrame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ textAlign: 'center', opacity }}>
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: COLORS.primary,
          textShadow: `0 0 40px ${COLORS.primary}, 0 0 80px ${COLORS.primary}60`,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {displayValue}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 16,
          color: COLORS.light,
          opacity: 0.7,
          marginTop: 12,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Cross-fade between images
const CrossfadeImage: React.FC<{
  src: string;
  fadeInStart: number;
  fadeInDuration: number;
  fadeOutStart: number;
  fadeOutDuration: number;
}> = ({ src, fadeInStart, fadeInDuration, fadeOutStart, fadeOutDuration }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(
    frame,
    [fadeInStart, fadeInStart + fadeInDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const fadeOut = interpolate(
    frame,
    [fadeOutStart, fadeOutStart + fadeOutDuration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  const scale = interpolate(frame, [fadeInStart, fadeOutStart + fadeOutDuration], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Main composition
export const HeroArchitecture: React.FC<{
  showWhiskBackground?: boolean;
}> = ({ showWhiskBackground = true }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Timeline (in frames at 30fps)
  const TIMELINE = {
    // Background fade in
    bgFadeIn: 0,
    bgFadeInDuration: 45,

    // Layer 1: AI Proposes (3-8s)
    layer1Start: 90,
    layer1TextStart: 120,
    layer1End: 240,

    // Layer 2: Code Limits (8-13s)
    layer2Start: 240,
    layer2TextStart: 270,
    layer2End: 390,

    // Layer 3: Human Decides (13-17s)
    layer3Start: 390,
    layer3TextStart: 420,
    layer3End: 510,

    // Stats (17-20s)
    statsStart: 510,
    statsFadeIn: 30,
  };

  // Overall vignette and color grading
  const vignetteOpacity = 0.6;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Layer 0: Neural Network Background with Ken Burns */}
      <AbsoluteFill>
        <Sequence from={0} durationInFrames={durationInFrames}>
          <AbsoluteFill style={{ opacity: 0.5 }}>
            <KenBurnsImage
              src={staticFile('assets/generated/neural_network_hero.png')}
              startScale={1}
              endScale={1.15}
              startX={0}
              endX={2}
              startY={0}
              endY={1}
            />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>

      {/* Color grading overlay */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${COLORS.secondary}30 0%, transparent 50%, ${COLORS.primary}20 100%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Layer 1: AI Proposes */}
      <CrossfadeImage
        src={staticFile('assets/generated/ai_intelligence_core.png')}
        fadeInStart={TIMELINE.layer1Start}
        fadeInDuration={30}
        fadeOutStart={TIMELINE.layer1End - 30}
        fadeOutDuration={30}
      />

      {/* Layer 2: Code Limits */}
      <CrossfadeImage
        src={staticFile('assets/generated/code_security_barrier.png')}
        fadeInStart={TIMELINE.layer2Start}
        fadeInDuration={30}
        fadeOutStart={TIMELINE.layer2End - 30}
        fadeOutDuration={30}
      />

      {/* Layer 3: Human Decides */}
      <CrossfadeImage
        src={staticFile('assets/generated/human_control_interface.png')}
        fadeInStart={TIMELINE.layer3Start}
        fadeInDuration={30}
        fadeOutStart={TIMELINE.layer3End - 30}
        fadeOutDuration={30}
      />


      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${COLORS.dark} 100%)`,
          opacity: vignetteOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Film grain effect (subtle) */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  );
};

export default HeroArchitecture;
