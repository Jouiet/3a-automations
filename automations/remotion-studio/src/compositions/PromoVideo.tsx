/**
 * PromoVideo Composition - Agency Showcase
 * Programmatic promotional video for 3A Automation
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

// Components
import { TitleSlide } from '../components/TitleSlide';
import { FeatureCard } from '../components/FeatureCard';
import { LogoReveal } from '../components/LogoReveal';
import { CallToAction } from '../components/CallToAction';
import { GradientBackground } from '../components/GradientBackground';

interface PromoVideoProps {
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundImage?: string;
}

export const PromoVideo: React.FC<PromoVideoProps> = ({
  title,
  subtitle,
  primaryColor,
  accentColor,
  backgroundImage,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Features to showcase
  const features = [
    { icon: '🤖', title: 'AI Automation', desc: '121+ workflows ready' },
    { icon: '📊', title: 'Real-time Analytics', desc: 'Track everything' },
    { icon: '🔗', title: 'Multi-channel', desc: 'Email, SMS, Voice' },
    { icon: '⚡', title: 'Instant Setup', desc: 'Deploy in minutes' },
  ];

  return (
    <AbsoluteFill>
      {/* Background Layer */}
      <GradientBackground
        primaryColor={primaryColor}
        secondaryColor={accentColor}
      />

      {/* Optional Whisk Background Image */}
      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.3 }}>
          <Img
            src={backgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Scene 1: Logo Reveal (0-3s) */}
      <Sequence from={0} durationInFrames={3 * fps}>
        <LogoReveal logoSrc="/logo.webp" />
      </Sequence>

      {/* Scene 2: Title Slide (3-8s) */}
      <Sequence from={3 * fps} durationInFrames={5 * fps}>
        <TitleSlide
          title={title}
          subtitle={subtitle}
          primaryColor={primaryColor}
        />
      </Sequence>

      {/* Scene 3: Feature Cards (8-24s) */}
      {features.map((feature, index) => (
        <Sequence
          key={feature.title}
          from={(8 + index * 4) * fps}
          durationInFrames={4 * fps}
        >
          <FeatureCard
            icon={feature.icon}
            title={feature.title}
            description={feature.desc}
            accentColor={accentColor}
            index={index}
          />
        </Sequence>
      ))}

      {/* Scene 4: Call to Action (24-30s) */}
      <Sequence from={24 * fps} durationInFrames={6 * fps}>
        <CallToAction
          text="Start Automating Today"
          buttonText="Book Demo"
          url="3a-automation.com"
          primaryColor={primaryColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
