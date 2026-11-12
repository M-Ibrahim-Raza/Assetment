// People signing up. "name" is what they asked to be called, not a full legal name.

export interface Person {
  name: string;
  email: string;
}

/** A typical new user. */
export const ayesha: Person = {
  name: "Ayesha",
  email: "ayesha.khan92@gmail.com",
};

/** A long name and a 61-character email, to test wrapping on a 320 px phone. */
export const longPerson: Person = {
  name: "Syeda Mehrunnisa Fatima Zahra",
  email: "muhammad.abdulrehman.siddiqui.personal.finance@protonmail.com",
};

/** An email that already has an account, so Create account fails with "already exists". */
export const TAKEN_EMAIL = "bilal.ahmed@gmail.com";

/** A password that passes the rules. */
export const GOOD_PASSWORD = "Chai-at-7pm";
