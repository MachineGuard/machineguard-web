/** Same rule as Core (IamService.validatePassword): 12 code points at least, 72 UTF-8 bytes at most. */
export const PASSWORD_MIN_CODE_POINTS = 12;
export const PASSWORD_MAX_BYTES = 72;

export type PasswordLengthIssue = 'short' | 'long';

export function passwordLengthIssue(password: string): PasswordLengthIssue | null {
  if ([...password].length < PASSWORD_MIN_CODE_POINTS) return 'short';
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return 'long';
  return null;
}
