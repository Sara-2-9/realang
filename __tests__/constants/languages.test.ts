import {
  LANGUAGES,
  getLanguageNameFromCode,
  HELSINKI_MODEL_MAP,
  APPLE_LANGUAGE_CODE_MAP,
} from '../../constants/languages';

describe('Language constants', () => {
  it('contains at least 29 languages', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(29);
  });

  it('maps Apple ISO codes correctly', () => {
    expect(APPLE_LANGUAGE_CODE_MAP['English']).toBe('en');
    expect(APPLE_LANGUAGE_CODE_MAP['Italian']).toBe('it');
    expect(APPLE_LANGUAGE_CODE_MAP['Japanese']).toBe('ja');
  });

  it('returns language name from ISO 639-2 code', () => {
    expect(getLanguageNameFromCode('eng')).toBe('English');
    expect(getLanguageNameFromCode('ita')).toBe('Italian');
    expect(getLanguageNameFromCode('jpn')).toBe('Japanese');
  });

  it('returns code itself for unknown language code', () => {
    expect(getLanguageNameFromCode('xyz')).toBe('xyz');
  });

  it('returns Unknown for undefined code', () => {
    expect(getLanguageNameFromCode(undefined)).toBe('Unknown');
  });

  it('has Helsinki models for common English pairs', () => {
    expect(HELSINKI_MODEL_MAP['English-Italian']).toBe('opus-mt-en-it');
    expect(HELSINKI_MODEL_MAP['English-Spanish']).toBe('opus-mt-en-es');
  });
});
