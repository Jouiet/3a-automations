/**
 * DemoVideo Composition - Product Walkthrough
 */
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
  spring,
} from 'remotion';

import { TitleSlide } from '../components/TitleSlide';
import { FeatureCard } from '../components/FeatureCard';
import { GradientBackground } from '../components/GradientBackground';
import { CallToAction } from '../components/CallToAction';

interface DemoVideoProps {
  productName: string;
  features: string[];
}

export const DemoVideo: React.FC<DemoVideoProps> = ({
  productName,
  features,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <GradientBackground
        primaryColor="#1e1b4b"
        secondaryColor="#312e81"
      />

      {/* Intro (0-5s) */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <TitleSlide
          title={productName}
          subtitle="Product Demo"
          primaryColor="#6366f1"
        />
      </Sequence>

      {/* Feature walkthroughs */}
      {features.map((feature, index) => (
        <Sequence
          key={feature}
          from={(5 + index * 12) * fps}
          durationInFrames={12 * fps}
        >
          <FeatureCard
            icon={['📊', '🤖', '🔗', '⚡'][index % 4]}
            title={feature}
            description={`Learn how ${feature.toLowerCase()} works`}
            accentColor="#22c55e"
            index={index}
          />
        </Sequence>
      ))}

      {/* Outro CTA */}
      <Sequence from={53 * fps} durationInFrames={7 * fps}>
        <CallToAction
          text="Ready to Get Started?"
          buttonText="Try Free"
          url="dashboard.3a-automation.com"
          primaryColor="#6366f1"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
