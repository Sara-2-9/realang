import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TranslationProvider, useTranslation } from '../../context/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider>{children}</TranslationProvider>
);

describe('TranslationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default languages', async () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userLanguage).toBe('English');
    expect(result.current.targetLanguage).toBe('English');
  });

  it('persists user language change', async () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.setUserLanguage('Italian');

    await waitFor(() => expect(result.current.userLanguage).toBe('Italian'));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'realang_user_language',
      'Italian'
    );
  });

  it('loads stored languages on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'realang_user_language') return Promise.resolve('Spanish');
      if (key === 'realang_target_language') return Promise.resolve('French');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useTranslation(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.userLanguage).toBe('Spanish');
    expect(result.current.targetLanguage).toBe('French');
  });
});
