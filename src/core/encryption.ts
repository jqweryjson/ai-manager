import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 бит
const SALT_LENGTH = 64; // 512 бит
const TAG_LENGTH = 16; // 128 бит
const KEY_LENGTH = 32; // 256 бит
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Генерирует ключ из пароля используя PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Шифрует данные используя AES-256-GCM
 * @param data - данные для шифрования
 * @param key - ключ шифрования (BACKEND_SECRET)
 * @returns зашифрованная строка в формате base64: salt:iv:tag:encrypted
 */
export function encrypt(data: string, key: string): string {
  if (!key) {
    throw new Error("Encryption key is required");
  }

  try {
    // Генерируем случайную соль и IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Деривируем ключ из пароля
    const derivedKey = deriveKey(key, salt);

    // Создаём cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    // Шифруем данные
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Получаем auth tag
    const tag = cipher.getAuthTag();

    // Формат: salt:iv:tag:encrypted (все в base64)
    return [
      salt.toString("base64"),
      iv.toString("base64"),
      tag.toString("base64"),
      encrypted,
    ].join(":");
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Расшифровывает данные используя AES-256-GCM
 * @param encrypted - зашифрованная строка в формате base64: salt:iv:tag:encrypted
 * @param key - ключ шифрования (BACKEND_SECRET)
 * @returns расшифрованные данные
 */
export function decrypt(encrypted: string, key: string): string {
  if (!key) {
    throw new Error("Decryption key is required");
  }

  try {
    // Разбираем формат: salt:iv:tag:encrypted
    const parts = encrypted.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    // После проверки длины безопасно привести к кортежу из 4 строк
    const [saltBase64, ivBase64, tagBase64, encryptedData] = parts as [
      string,
      string,
      string,
      string,
    ];

    // Декодируем из base64
    const salt = Buffer.from(saltBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");

    // Деривируем ключ из пароля
    const derivedKey = deriveKey(key, salt);

    // Создаём decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    // Расшифровываем данные
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
