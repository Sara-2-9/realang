export class File {
  constructor(public uri: string) {}

  get exists() {
    return true;
  }

  get size() {
    return 15000;
  }

  delete = jest.fn(() => Promise.resolve());
  base64 = jest.fn(() => Promise.resolve('base64mockaudio'));
}

export const Paths = {
  cache: 'file:///mock/cache/',
  document: 'file:///mock/documents/',
};
