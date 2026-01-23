/**
 * TestimonialVideo Composition - Client Success Story
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

import { GradientBackground } from '../components/GradientBackground';

interface TestimonialVideoProps {
  clientName: string;
  quote: string;
  clientLogo?: string;
}

export const TestimonialVideo: React.FC<TestimonialVideoProps> = ({
  clientName,
  quote,
  clientLogo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typing effect for quote
  const visibleChars = Math.floor(
    interpolate(
      frame,
      [3 * fps, 25 * fps],
      [0, quote.length],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  );

  const displayedQuote = quote.substring(0, visibleChars);

  // Fade in client name
  const nameOpacity = interpolate(
    frame,
    [28 * fps, 30 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      <GradientBackground
        primaryColor="#1e293b"
        secondaryColor="#0f172a"
      />

      {/* Quote marks */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10%',
        }}
      >
        {/* Opening quote */}
        <span
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            fontSize: 200,
            color: 'rgba(99, 102, 241, 0.2)',
            fontFamily: 'Georgia, serif',
          }}
        >
          "
        </span>

        {/* Quote text with typing effect */}
        <p
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '80%',
            fontStyle: 'italic',
          }}
        >
          {displayedQuote}
          <span
            style={{
              opacity: frame % 30 < 15 ? 1 : 0,
              color: '#6366f1',
            }}
          >
            |
          </span>
        </p>

        {/* Client attribution */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            opacity: nameOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {clientLogo && (
            <Img
              src={clientLogo}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '3px solid #6366f1',
              }}
            />
          )}
          <div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'white',
                margin: 0,
              }}
            >
              {clientName}
            </p>
            <p
              style={{
                fontSize: 18,
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Verified Client
            </p>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
