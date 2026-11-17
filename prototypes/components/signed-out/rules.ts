// The rules the signed-out screens share: Sign up, Sign in, Forgot password and Reset password.

/** Better Auth's default shortest password. */
export const MIN_PASSWORD = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with a new password, in plain words. Null when it's fine. */
export function newPasswordError(password: string): string | null {
  if (password === "") return "Make a password.";
  return password.length < MIN_PASSWORD
    ? `Use at least ${String(MIN_PASSWORD)} characters.`
    : null;
}

/** What is wrong with an email, in plain words. Null when it looks fine. */
export function emailError(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === "") return "Type your email.";
  return EMAIL.test(trimmed)
    ? null
    : "This doesn't look like an email. Check the @ and the dot.";
}
