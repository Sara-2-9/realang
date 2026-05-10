import { transcribeAudio, textToSpeech } from '../../api/elevenlabs';

jest.mock('expo-file-system', () => ({
  File: function File(uri) {
    this.uri = uri;
    this.exists = uri.includes('/mock/');
    this.size = 15000;
    this.delete = jest.fn(() => Promise.resolve());
    this.base64 = jest.fn(() => Promise.resolve('base64mockaudio'));
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock/cache/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { Base64: 'base64' },
}));

describe('transcribeAudio', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('returns null if file does not exist', async () => {
    const result = await transcribeAudio('file:///fake/audio.m4a', 'test-key');
    expect(result).toBeNull();
  });

  it('returns transcription result on success', async () => {
    const mockResponse = {
      text: 'Hello world',
      language_code: 'eng',
      words: [],
      utterances: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    });

    const result = await transcribeAudio('file:///mock/audio.m4a', 'test-key');
    expect(result).not.toBeNull();
    expect(result?.text).toBe('Hello world');
    expect(result?.detected_language).toBe('English');
  });

  it('throws on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
      statusText: 'Unauthorized',
    });

    await expect(transcribeAudio('file:///mock/audio.m4a', 'bad-key')).rejects.toThrow('API Error 401');
  });
});

describe('textToSpeech', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('throws on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    });

    await expect(textToSpeech('Hello', 'English', 'test-key')).rejects.toThrow('TTS failed: 429');
  });
});
