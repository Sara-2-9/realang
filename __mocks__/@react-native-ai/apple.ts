export const AppleTranscription = {
  isAvailable: jest.fn(() => Promise.resolve(true)),
};

export const apple = {
  transcriptionModel: jest.fn(() => ({
    prepare: jest.fn(() => Promise.resolve()),
  })),
};
