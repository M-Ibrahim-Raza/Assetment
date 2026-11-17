// Carries the email typed on Sign in over to Forgot password, in memory only. It never goes in
// the URL, which ends up in history, and is never saved on the device. A reload clears it.

let carried = "";

/** Keeps the email typed on Sign in, as they open Forgot password. */
export function carryEmail(email: string) {
  carried = email.trim();
}

/** The email carried over from Sign in, or "" when they came another way. */
export const carriedEmail = (): string => carried;

/** Forgets it once Forgot password has filled it in. */
export function clearCarriedEmail() {
  carried = "";
}
