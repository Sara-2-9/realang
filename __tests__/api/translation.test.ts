import { translateTextWithNLLB } from '../../api/translation';

describe('translateTextWithNLLB', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('returns original text if source and target are the same', async () => {
    const result = await translateTextWithNLLB('Ciao', 'Italian', 'Italian');
    expect(result).toBe('Ciao');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns empty string for empty input', async () => {
    const result = await translateTextWithNLLB('', 'English', 'Italian');
    expect(result).toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('translates directly if model pair exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ translation_text: 'Ciao mondo' }],
    });

    const result = await translateTextWithNLLB('Hello world', 'English', 'Italian');
    expect(result).toBe('Ciao mondo');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back via English bridge if no direct model', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ translation_text: 'Hello' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ translation_text: 'Namaste' }],
      });

    const result = await translateTextWithNLLB('Ciao', 'Italian', 'Hindi');
    expect(result).toBe('Namaste');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries once on 503 model loading', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Model loading',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ translation_text: 'Bonjour' }],
      });

    const promise = translateTextWithNLLB('Hello', 'English', 'French');
    await jest.advanceTimersByTimeAsync(12000);
    const result = await promise;

    expect(result).toBe('Bonjour');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  }, 15000);

  it('throws on unsupported language pair without bridge', async () => {
    await expect(
      translateTextWithNLLB('text', 'Klingon', 'Italian')
    ).rejects.toThrow('Translation not supported');
  });
});
