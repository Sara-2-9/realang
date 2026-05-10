export const useAudioRecorder = jest.fn(() => ({
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  record: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  uri: 'file:///mock/recording.m4a',
}));

export const useAudioRecorderState = jest.fn(() => ({
  status: 'done',
}));

export const RecordingPresets = {
  HIGH_QUALITY: {
    extension: '.m4a',
    outputFormat: 'mpeg_4',
    audioEncoder: 'aac',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
};

export const setAudioModeAsync = jest.fn(() => Promise.resolve());

export const AudioModule = {
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
};

export const createAudioPlayer = jest.fn(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
}));
