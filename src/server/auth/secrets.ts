const sha256 = async (value: string): Promise<Uint8Array> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return new Uint8Array(digest)
}

// Hashing first gives both sides the same length, so the comparison time
// reveals neither the secret's length nor how many leading characters matched.
export const timingSafeEqual = async (provided: string, expected: string): Promise<boolean> => {
  const [providedHash, expectedHash] = await Promise.all([sha256(provided), sha256(expected)])

  let difference = 0
  for (let index = 0; index < expectedHash.length; index++) {
    difference |= providedHash[index] ^ expectedHash[index]
  }
  return difference === 0
}
