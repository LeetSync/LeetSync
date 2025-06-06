import { capitalize } from '../utils/string-manipulation.helper';

describe('capitalize', () => {
  it('capitalizes each word', () => {
    expect(capitalize('hello world')).toBe('Hello World');
  });

  it('handles multiple spaces and trimming', () => {
    expect(capitalize('  hello   world  ')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});
