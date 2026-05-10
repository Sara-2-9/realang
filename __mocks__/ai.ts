export const experimental_transcribe = jest.fn(() =>
  Promise.resolve({ text: 'Mock transcription result' })
);
