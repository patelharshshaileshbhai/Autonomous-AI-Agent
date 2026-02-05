import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM
 * @param text - The plaintext to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(text: string): string {
    const key = Buffer.from(env.wallet.encryptionKey, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string
 * @param encryptedText - The encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
    const key = Buffer.from(env.wallet.encryptionKey, 'hex');
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0]!, 'base64');
    const authTag = Buffer.from(parts[1]!, 'base64');
    const encrypted = parts[2]!;

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Generates a random encryption key (for setup purposes)
 * @returns A 32-byte hex string suitable for WALLET_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a string using SHA-256 (for non-reversible hashing)
 * @param text - The string to hash
 * @returns SHA-256 hash as hex string
 */
export function hashSHA256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}
