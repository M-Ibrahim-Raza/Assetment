/** An email inside a sentence. A long one breaks anywhere, so a 320 px phone never scrolls sideways. */
export function Email({ email }: { email: string }) {
  return <strong className="font-semibold wrap-anywhere">{email}</strong>;
}
