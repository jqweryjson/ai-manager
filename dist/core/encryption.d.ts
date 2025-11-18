/**
 * Шифрует данные используя AES-256-GCM
 * @param data - данные для шифрования
 * @param key - ключ шифрования (BACKEND_SECRET)
 * @returns зашифрованная строка в формате base64: salt:iv:tag:encrypted
 */
export declare function encrypt(data: string, key: string): string;
/**
 * Расшифровывает данные используя AES-256-GCM
 * @param encrypted - зашифрованная строка в формате base64: salt:iv:tag:encrypted
 * @param key - ключ шифрования (BACKEND_SECRET)
 * @returns расшифрованные данные
 */
export declare function decrypt(encrypted: string, key: string): string;
//# sourceMappingURL=encryption.d.ts.map