/**
 * Root Component - All Remotion Compositions
 * 3A Automation Video Studio
 */
import React from 'react';
import { Composition } from 'remotion';

// Video Compositions
import { PromoVideo } from './compositions/PromoVideo';
import { DemoVideo } from './compositions/DemoVideo';
import { AdVideo } from './compositions/AdVideo';
import { TestimonialVideo } from './compositions/TestimonialVideo';
import { HeroArchitecture } from './compositions/HeroArchitecture';

// Video Presets
const PRESETS = {
  landscape1080: { width: 1920, height: 1080 },
  landscape720: { width: 1280, height: 720 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  shorts: { width: 1080, height: 1920 },
};

export const Root: React.FC = () => {
  return (
    <>
      {/* Promo Video - Agency Showcase */}
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={30 * 30} // 30 seconds at 30fps
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          title: '3A Automation',
          subtitle: 'AI-Powered Business Automation',
          primaryColor: '#6366f1',
          accentColor: '#22c55e',
          backgroundImage: '/assets/whisk/neural_cortex_bg.png',
        }}
      />

      {/* Demo Video - Product Walkthrough */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={60 * 30} // 60 seconds
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          productName: '3A Dashboard',
          features: [
            'Real-time Analytics',
            'AI-Powered Insights',
            'Multi-Channel Integration',
            'Automated Workflows',
          ],
        }}
      />

      {/* Ad Video - Short Social Media Ad */}
      <Composition
        id="AdVideo"
        component={AdVideo}
        durationInFrames={15 * 30} // 15 seconds
        fps={30}
        {...PRESETS.portrait}
        defaultProps={{
          headline: 'Automate Everything',
          cta: 'Start Free Trial',
          logoSrc: '/logo.webp',
        }}
      />

      {/* Testimonial Video */}
      <Composition
        id="TestimonialVideo"
        component={TestimonialVideo}
        durationInFrames={45 * 30} // 45 seconds
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          clientName: 'Alpha Medical',
          quote: 'We reduced manual work by 80% with 3A Automation',
          clientLogo: '/assets/clients/alpha-medical.png',
        }}
      />

      {/* Square format for Instagram */}
      <Composition
        id="AdVideo-Square"
        component={AdVideo}
        durationInFrames={15 * 30}
        fps={30}
        {...PRESETS.square}
        defaultProps={{
          headline: 'Automate Everything',
          cta: 'Start Free Trial',
          logoSrc: '/logo.webp',
        }}
      />

      {/* Hero Architecture - Homepage Background Video */}
      <Composition
        id="HeroArchitecture"
        component={HeroArchitecture}
        durationInFrames={20 * 30} // 20 seconds at 30fps
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          showWhiskBackground: true,
        }}
      />

      {/* Hero Architecture - Loop Version (8s for seamless loop) */}
      <Composition
        id="HeroArchitecture-Loop"
        component={HeroArchitecture}
        durationInFrames={8 * 30} // 8 seconds loop
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          showWhiskBackground: true,
        }}
      />
    </>
  );
};
