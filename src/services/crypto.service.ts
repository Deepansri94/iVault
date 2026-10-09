/**
 * @file crypto.service.ts
 * Cryptographic Security Engine via Web Crypto API (AES-GCM 256-bit + PBKDF2)
 *
 * Provides client-side cryptographic isolation for sensitive passwords, credentials,
 * and confidential identity documents with zero server-side exposure.
 */

/**
 * Serialized payload representing AES-GCM encrypted data
 */
export interface EncryptedPayload {
  /** Base64-encoded encrypted ciphertext buffer */
  ciphertext: string;
  /** Base64-encoded 12-byte initialization vector (IV) */
  iv: string;
  /** Base64-encoded 16-byte PBKDF2 salt buffer */
  salt: string;
}

/**
 * Options configuring secure randomized password generation
 */
export interface PasswordGeneratorOptions {
  /** Target password character length (e.g., 16-32) */
  length: number;
  /** Whether to include uppercase letters (A-Z) */
  includeUppercase: boolean;
  /** Whether to include lowercase letters (a-z) */
  includeLowercase: boolean;
  /** Whether to include numerical digits (0-9) */
  includeNumbers: boolean;
  /** Whether to include special symbol characters */
  includeSymbols: boolean;
  /** Whether to omit ambiguous characters like 'l', '1', 'O', '0' */
  excludeAmbiguous: boolean;
}

/**
 * Security and Entropy Evaluation Score for a given passphrase
 */
export interface PasswordStrengthResult {
  /** Score on a 0-100 scale */
  score: number;
  /** Human-readable tier label */
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  /** Hex color code for UI meter display */
  color: string;
}

/**
 * Production-ready Web Crypto API (AES-GCM 256-bit + PBKDF2) Service.
 * Universal support for both modern browsers and Node.js / Vitest test runners.
 */
export class CryptoService {
  /** Number of iterations for PBKDF2 key derivation */
  private static readonly PBKDF2_ITERATIONS = 100_000;
  /** AES key length in bits */
  private static readonly KEY_LENGTH = 256;

  /**
   * Returns the subtle crypto implementation across browser and Node.js environments.
   */
  private static getCrypto(): Crypto {
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      return globalThis.crypto;
    }
    throw new Error('Web Crypto API is not supported in the current environment.');
  }

  /**
   * Derives an AES-GCM CryptoKey from a plaintext passphrase and salt using PBKDF2.
   *
   * @param passphrase The user master key or PIN
   * @param salt Cryptographic random salt buffer
   * @returns Derived AES-GCM CryptoKey
   */
  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const cryptoInstance = this.getCrypto();
    const encoder = new TextEncoder();
    const passphraseKey = await cryptoInstance.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return cryptoInstance.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passphraseKey,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext string using AES-GCM 256-bit with PBKDF2 key derivation.
   *
   * @param plaintext Sensitive data to encrypt
   * @param masterKey User master passphrase
   * @returns Base64 encoded payload with ciphertext, IV, and salt
   */
  public static async encrypt(plaintext: string, masterKey: string): Promise<EncryptedPayload> {
    const cryptoInstance = this.getCrypto();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    // 16-byte random salt for PBKDF2
    const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
    // 12-byte random IV standard for AES-GCM
    const iv = cryptoInstance.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(masterKey, salt);

    const ciphertextBuffer = await cryptoInstance.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    return {
      ciphertext: this.bufferToBase64(new Uint8Array(ciphertextBuffer)),
      iv: this.bufferToBase64(iv),
      salt: this.bufferToBase64(salt),
    };
  }

  /**
   * Decrypts AES-GCM 256-bit ciphertext with the corresponding master passphrase.
   *
   * @param payload Base64 encrypted payload (ciphertext, iv, salt)
   * @param masterKey User master passphrase
   * @returns Decrypted original plaintext string
   * @throws OperationError if passphrase or data is corrupted
   */
  public static async decrypt(payload: EncryptedPayload, masterKey: string): Promise<string> {
    const cryptoInstance = this.getCrypto();
    const salt = this.base64ToBuffer(payload.salt);
    const iv = this.base64ToBuffer(payload.iv);
    const ciphertext = this.base64ToBuffer(payload.ciphertext);

    const key = await this.deriveKey(masterKey, salt);

    const decryptedBuffer = await cryptoInstance.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Hashes a PIN or Passphrase with SHA-256 for local authentication verification.
   *
   * @param pin Raw PIN or passphrase string
   * @returns Base64 encoded SHA-256 hash string
   */
  public static async hashMasterPin(pin: string): Promise<string> {
    const cryptoInstance = this.getCrypto();
    const encoder = new TextEncoder();
    const data = encoder.encode(`iVaultPro_Salt_${pin}`);
    const hashBuffer = await cryptoInstance.subtle.digest('SHA-256', data);
    return this.bufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Redacts sensitive identity document numbers (Aadhaar, Passport, PAN) for display.
   *
   * @param rawId Raw document identification string
   * @param maskType 'strict' for full concealment or 'partial' for preserving last 4 digits
   * @returns Safe redacted placeholder
   */
  public static getRedactedPlaceholder(
    rawId?: string,
    maskType: 'strict' | 'partial' = 'strict'
  ): string {
    if (!rawId) return '[Document ID Omitted]';
    if (maskType === 'strict') {
      return '[Document ID Omitted]';
    }
    const trimmed = rawId.trim();
    if (trimmed.length <= 4) return '****';
    const last4 = trimmed.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }

  /**
   * Generates a cryptographically strong pseudo-random password conforming to specified criteria.
   *
   * @param options Configuration options including length and character subsets
   * @returns Securely generated password string
   */
  public static generateSecurePassword(options: PasswordGeneratorOptions): string {
    const cryptoInstance = this.getCrypto();
    let uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let lowercase = 'abcdefghijkmnpqrstuvwxyz';
    let numbers = '23456789';
    let symbols = '!@#$%^&*()_+~|}{[]:;?><,.-=';

    if (!options.excludeAmbiguous) {
      uppercase += 'IO';
      lowercase += 'lo';
      numbers += '01';
    }

    let charPool = '';
    const guaranteedChars: string[] = [];

    if (options.includeUppercase) {
      charPool += uppercase;
      guaranteedChars.push(this.getRandomChar(uppercase, cryptoInstance));
    }
    if (options.includeLowercase) {
      charPool += lowercase;
      guaranteedChars.push(this.getRandomChar(lowercase, cryptoInstance));
    }
    if (options.includeNumbers) {
      charPool += numbers;
      guaranteedChars.push(this.getRandomChar(numbers, cryptoInstance));
    }
    if (options.includeSymbols) {
      charPool += symbols;
      guaranteedChars.push(this.getRandomChar(symbols, cryptoInstance));
    }

    if (!charPool) {
      charPool = lowercase + numbers;
      guaranteedChars.push(this.getRandomChar(lowercase, cryptoInstance));
    }

    const remainingLength = Math.max(0, options.length - guaranteedChars.length);
    const randomArray = new Uint32Array(remainingLength);
    cryptoInstance.getRandomValues(randomArray);

    const generated: string[] = [...guaranteedChars];
    for (let i = 0; i < remainingLength; i++) {
      generated.push(charPool[randomArray[i] % charPool.length]);
    }

    // Cryptographic Fisher-Yates shuffle
    for (let i = generated.length - 1; i > 0; i--) {
      const randIdxArray = new Uint32Array(1);
      cryptoInstance.getRandomValues(randIdxArray);
      const j = randIdxArray[0] % (i + 1);
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    return generated.join('');
  }

  /**
   * Selects a single random character from a character pool using cryptographic randomness.
   */
  private static getRandomChar(pool: string, cryptoInstance: Crypto): string {
    const rand = new Uint32Array(1);
    cryptoInstance.getRandomValues(rand);
    return pool[rand[0] % pool.length];
  }

  /**
   * Evaluates password entropy and returns numerical score (0-100) and tier rating.
   *
   * @param password Password to analyze
   * @returns Score and strength tier object
   */
  public static calculatePasswordStrength(password: string): PasswordStrengthResult {
    if (!password) {
      return { score: 0, label: 'Very Weak', color: '#EF4444' };
    }

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    const entropy = password.length * Math.log2(Math.max(poolSize, 2));

    let score = Math.min(100, Math.round((entropy / 80) * 100));
    if (password.length < 8) score = Math.min(score, 30);

    if (score < 30) return { score, label: 'Very Weak', color: '#EF4444' };
    if (score < 50) return { score, label: 'Weak', color: '#F97316' };
    if (score < 70) return { score, label: 'Fair', color: '#FBBF24' };
    if (score < 90) return { score, label: 'Strong', color: '#10B981' };
    return { score, label: 'Very Strong', color: '#059669' };
  }

  /**
   * Hashes a master PIN or passphrase using SHA-256 for secure comparison.
   *
   * @param pin Plaintext PIN or passphrase
   * @returns Base64 encoded SHA-256 hash
   */
  public static async hashPin(pin: string): Promise<string> {
    const cryptoInstance = this.getCrypto();
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await cryptoInstance.subtle.digest('SHA-256', data);
    return this.bufferToBase64(new Uint8Array(hashBuffer));
  }

  // --- Universal Base64 Helpers ---

  /**
   * Encodes a Uint8Array into a Base64 string universally across Browser and Node environments.
   */
  private static bufferToBase64(buffer: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(buffer).toString('base64');
    }
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return (typeof window !== 'undefined' ? window.btoa : btoa)(binary);
  }

  /**
   * Decodes a Base64 string into a Uint8Array universally across Browser and Node environments.
   */
  private static base64ToBuffer(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binary = (typeof window !== 'undefined' ? window.atob : atob)(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
