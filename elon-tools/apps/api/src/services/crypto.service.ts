/**
 * Crypto utilities: hashing + AES-GCM encryption for customer secrets.
 */

/** SHA-256 hash, returns hex string */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a cryptographically secure random token (URL-safe base64) */
export function generateToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── AES-GCM Encryption (for customer integration secrets) ──

async function importKey(hexKey: string): Promise<CryptoKey> {
  const raw = new Uint8Array(hexKey.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(
  plaintext: string,
  masterKeyHex: string,
): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const key = await importKey(masterKeyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // AES-GCM appends 16-byte auth tag to ciphertext
  const combined = new Uint8Array(encrypted);
  const ciphertextBytes = combined.slice(0, combined.length - 16);
  const tagBytes = combined.slice(combined.length - 16);

  return {
    ciphertext: btoa(String.fromCharCode(...ciphertextBytes)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tagBytes)),
  };
}

export async function decrypt(
  ciphertext: string,
  iv: string,
  tag: string,
  masterKeyHex: string,
): Promise<string> {
  const key = await importKey(masterKeyHex);
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const tagBytes = Uint8Array.from(atob(tag), (c) => c.charCodeAt(0));

  // Recombine ciphertext + tag for WebCrypto
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes);
  combined.set(tagBytes, ciphertextBytes.length);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, combined);
  return new TextDecoder().decode(decrypted);
}
