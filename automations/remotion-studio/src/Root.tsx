/**
 * Root Component - All Remotion Compositions
 * 3A Automation Video Studio
 */
import React from 'react';
import { Composition, staticFile } from 'remotion';

// Video Compositions
import { PromoVideo } from './compositions/PromoVideo';
import { DemoVideo } from './compositions/DemoVideo';
import { AdVideo } from './compositions/AdVideo';
import { TestimonialVideo } from './compositions/TestimonialVideo';
import { HeroArchitecture } from './compositions/HeroArchitecture';

// Subsidiary Compositions
import { AlphaMedicalAd } from './compositions/AlphaMedicalAd';
import { MyDealzAd } from './compositions/MyDealzAd';

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
          backgroundImage: staticFile('assets/whisk/neural_cortex_bg.png'),
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
          logoSrc: staticFile('logo.webp'),
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
          clientLogo: staticFile('logo.webp'), // TODO: Add client logos to /assets/clients/
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
          logoSrc: staticFile('logo.webp'),
        }}
      />

      {/* Hero Architecture - Homepage Background Video */}
      <Composition
        id="HeroArchitecture"
        component={HeroArchitecture}
        durationInFrames={240} // 8 seconds at 30fps
        fps={30}
        {...PRESETS.landscape1080}
        defaultProps={{
          showWhiskBackground: true,
        }}
      />

      {/* Alpha Medical - Medical Equipment E-commerce */}
      <Composition
        id="AlphaMedicalAd"
        component={AlphaMedicalAd}
        durationInFrames={15 * 30} // 15 seconds
        fps={30}
        {...PRESETS.portrait}
        defaultProps={{
          headline: 'Équipement Médical Professionnel',
          subheadline: 'Qualité certifiée pour les pros',
          cta: 'Découvrir',
          trustBadges: ['CE Certifié', 'Livraison 48h', 'SAV Expert'],
        }}
      />

      {/* Alpha Medical - Square format */}
      <Composition
        id="AlphaMedicalAd-Square"
        component={AlphaMedicalAd}
        durationInFrames={15 * 30}
        fps={30}
        {...PRESETS.square}
        defaultProps={{
          headline: 'Équipement Médical Pro',
          cta: 'Commander',
          trustBadges: ['CE Certifié', 'Livraison 48h'],
        }}
      />

      {/* MyDealz - Fashion E-commerce (NOTE: Store HTTP 402) */}
      <Composition
        id="MyDealzAd"
        component={MyDealzAd}
        durationInFrames={15 * 30} // 15 seconds
        fps={30}
        {...PRESETS.portrait}
        defaultProps={{
          headline: 'Nouvelles Tendances',
          subheadline: 'Mode & Style',
          cta: 'Shopper',
          flashSale: false,
        }}
      />

      {/* MyDealz - Flash Sale mode */}
      <Composition
        id="MyDealzAd-FlashSale"
        component={MyDealzAd}
        durationInFrames={15 * 30}
        fps={30}
        {...PRESETS.portrait}
        defaultProps={{
          headline: 'VENTE FLASH',
          subheadline: 'Jusqu\'à -50%',
          cta: 'Profiter',
          discountBadge: '-50%',
          flashSale: true,
        }}
      />

      {/* MyDealz - Square format */}
      <Composition
        id="MyDealzAd-Square"
        component={MyDealzAd}
        durationInFrames={15 * 30}
        fps={30}
        {...PRESETS.square}
        defaultProps={{
          headline: 'Nouvelles Tendances',
          cta: 'Shopper',
          flashSale: false,
        }}
      />
    </>
  );
};
