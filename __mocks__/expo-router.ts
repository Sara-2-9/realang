export const useRouter = jest.fn(() => ({
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
}));

export const useSegments = jest.fn(() => []);

export const Stack = ({ children }: { children: React.ReactNode }) => children;
export const Tabs = ({ children }: { children: React.ReactNode }) => children;
