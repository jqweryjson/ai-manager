export function chunkText(text, userId, docId, source, chunkSize = 800, overlap = 0.18) {
    const chunks = [];
    const step = Math.floor(chunkSize * (1 - overlap));
    for (let i = 0; i < text.length; i += step) {
        const end = Math.min(i + chunkSize, text.length);
        const chunkText = text.slice(i, end).trim();
        if (chunkText.length === 0)
            continue;
        chunks.push({
            id: `${docId}_${chunks.length}`,
            text: chunkText,
            metadata: {
                user_id: userId,
                doc_id: docId,
                chunk_index: chunks.length,
                source,
                updated_at: new Date().toISOString(),
            },
        });
    }
    return chunks;
}
//# sourceMappingURL=chunking.js.map