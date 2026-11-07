import { passwordLengthIssue } from './password-policy';

describe('password length policy', () => {
  it('requires 12 code points', () => {
    expect(passwordLengthIssue('a'.repeat(11))).toBe('short');
    expect(passwordLengthIssue('a'.repeat(12))).toBeNull();
  });

  it('limits the password to 72 UTF-8 bytes, not characters', () => {
    expect(passwordLengthIssue('ñ'.repeat(36))).toBeNull();
    expect(passwordLengthIssue('ñ'.repeat(37))).toBe('long');
    expect(passwordLengthIssue('a'.repeat(72))).toBeNull();
    expect(passwordLengthIssue('a'.repeat(73))).toBe('long');
  });

  it('counts an emoji as one code point, as Core does', () => {
    expect(passwordLengthIssue('😀'.repeat(12))).toBeNull();
    expect(passwordLengthIssue('😀'.repeat(11))).toBe('short');
  });
});
