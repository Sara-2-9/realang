import React from 'react';
import { render } from '@testing-library/react-native';
import TranscriptBubble from '../../components/TranscriptBubble';

describe('TranscriptBubble', () => {
  const baseMessage = {
    id: '1',
    participantId: 'spk_0',
    participantName: 'Speaker 1',
    originalText: 'Ciao',
    translatedText: 'Hello',
    originalLanguage: 'Italian',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    speakerColor: '#9BB068',
    isTranslating: false,
  };

  it('renders original and translated text', () => {
    const { getByText } = render(
      <TranscriptBubble
        message={baseMessage}
        isOwnMessage={false}
        speakerColor="#9BB068"
        targetLanguage="English"
      />
    );

    expect(getByText('Ciao')).toBeTruthy();
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
  });

  it('shows same-language badge when no translation needed', () => {
    const msg = {
      ...baseMessage,
      originalLanguage: 'English',
      translatedText: 'Hello',
    };

    const { getByText } = render(
      <TranscriptBubble
        message={msg}
        isOwnMessage={false}
        targetLanguage="English"
      />
    );

    expect(getByText('Same')).toBeTruthy();
  });

  it('shows loading indicator while translating', () => {
    const msg = {
      ...baseMessage,
      isTranslating: true,
      translatedText: 'Translating to English...',
    };

    const { getByText } = render(
      <TranscriptBubble
        message={msg}
        isOwnMessage={false}
        targetLanguage="English"
      />
    );

    expect(getByText('Translating to English...')).toBeTruthy();
  });
});
