/**
 * @file crypto.service.spec.ts
 * Unit Test Suite for AES-GCM 256-bit Web Crypto Service
 */

import { describe, it, expect } from 'vitest';
import { CryptoService } from '../services/crypto.service';

describe('CryptoService (AES-GCM 256-bit + PBKDF2)', () => {
  const masterKey = 'MasterSecretPass#2026';
  const plaintext = 'SensitiveBankingPassword@987';

  it('should encrypt and decrypt plaintext accurately using AES-GCM', async () => {
    const encrypted = await CryptoService.encrypt(plaintext, masterKey);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();

    const decrypted = await CryptoService.decrypt(encrypted, masterKey);
    expect(decrypted).toEqual(plaintext);
  });

  it('should fail decryption when provided an invalid master passphrase', async () => {
    const encrypted = await CryptoService.encrypt(plaintext, masterKey);
    await expect(
      CryptoService.decrypt(encrypted, 'WrongPassphrase#999')
    ).rejects.toThrow();
  });

  it('should fail decryption if payload ciphertext is corrupted', async () => {
    const encrypted = await CryptoService.encrypt(plaintext, masterKey);
    const corruptedPayload = {
      ...encrypted,
      ciphertext: 'bm90LXZhbGlkLWNpcGhlcnRleHQ=',
    };
    await expect(
      CryptoService.decrypt(corruptedPayload, masterKey)
    ).rejects.toThrow();
  });

  it('should hash master PIN using SHA-256 with salt', async () => {
    const pin = '4829';
    const hash1 = await CryptoService.hashMasterPin(pin);
    const hash2 = await CryptoService.hashMasterPin(pin);
    const hashDifferent = await CryptoService.hashMasterPin('1234');

    expect(hash1).toBeDefined();
    expect(hash1).toEqual(hash2);
    expect(hash1).not.toEqual(hashDifferent);
  });

  describe('Document ID Redaction', () => {
    it('should strictly return [Document ID Omitted] in strict redaction mode', () => {
      const rawId = 'ABCDE1234F';
      const redacted = CryptoService.getRedactedPlaceholder(rawId, 'strict');
      expect(redacted).toEqual('[Document ID Omitted]');
    });

    it('should partially mask document IDs by preserving last 4 characters in partial mode', () => {
      const rawAadhaar = '1234-5678-9012';
      const redacted = CryptoService.getRedactedPlaceholder(rawAadhaar, 'partial');
      expect(redacted).toEqual('XXXX-XXXX-9012');
    });

    it('should return **** for IDs with 4 or fewer characters in partial mode', () => {
      expect(CryptoService.getRedactedPlaceholder('1234', 'partial')).toEqual('****');
      expect(CryptoService.getRedactedPlaceholder('AB', 'partial')).toEqual('****');
    });

    it('should handle undefined or empty document IDs gracefully', () => {
      expect(CryptoService.getRedactedPlaceholder(undefined)).toEqual('[Document ID Omitted]');
      expect(CryptoService.getRedactedPlaceholder('')).toEqual('[Document ID Omitted]');
    });
  });

  describe('Password Generator & Entropy Meter', () => {
    it('should generate a secure randomized password conforming to criteria', () => {
      const password = CryptoService.generateSecurePassword({
        length: 24,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: true,
      });

      expect(password.length).toEqual(24);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);

      const strength = CryptoService.calculatePasswordStrength(password);
      expect(strength.score).toBeGreaterThanOrEqual(75);
      expect(['Strong', 'Very Strong']).toContain(strength.label);
    });

    it('should exclude ambiguous characters when requested', () => {
      for (let i = 0; i < 5; i++) {
        const password = CryptoService.generateSecurePassword({
          length: 32,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: false,
          excludeAmbiguous: true,
        });

        // Ambiguous characters: I, O, l, o, 0, 1
        expect(/[IOlo01]/.test(password)).toBe(false);
      }
    });

    it('should accurately categorize password strength levels', () => {
      expect(CryptoService.calculatePasswordStrength('').label).toEqual('Very Weak');
      expect(CryptoService.calculatePasswordStrength('12345').label).toEqual('Very Weak');
      expect(CryptoService.calculatePasswordStrength('secret12').label).toEqual('Fair');
      expect(CryptoService.calculatePasswordStrength('password123').label).toEqual('Strong');
      expect(CryptoService.calculatePasswordStrength('Tr0ub4dor&34!99Z').label).toEqual('Very Strong');
    });
  });
});
