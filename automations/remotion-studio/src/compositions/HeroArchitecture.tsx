/**
 * HeroArchitecture.tsx - v52 "Luminous Geometric" Video Bridge
 * 
 * Purpose: High-precision frame extraction for the homepage scroll animation.
 * Source: The_luminous_geometric_1080p_202601241453.mp4
 * Duration: 8 seconds (240 frames @ 30fps)
 */

import React from 'react';
import { AbsoluteFill, Video, staticFile } from 'remotion';

export const HeroArchitecture: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video
        src={staticFile('video/luminous-geometric.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

export default HeroArchitecture;
