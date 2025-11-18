export function buildContextFromRetrieved(retrieved, options) {
    const { maxChunksTotal, maxChunksPerDoc, maxCharsTotal } = options;
    // Dedup по chunkId и сортировка по score убыв.
    const seenChunkIds = new Set();
    const uniqueSorted = retrieved
        .filter(c => {
        if (seenChunkIds.has(c.chunkId))
            return false;
        seenChunkIds.add(c.chunkId);
        return true;
    })
        .sort((a, b) => b.score - a.score);
    // Диверсификация по docId + лимит на документ и общий лимит
    const docCounts = new Map();
    const selected = [];
    let totalChars = 0;
    for (const item of uniqueSorted) {
        if (selected.length >= maxChunksTotal)
            break;
        const currentPerDoc = docCounts.get(item.docId) || 0;
        if (currentPerDoc >= maxChunksPerDoc)
            continue;
        if (totalChars + item.text.length > maxCharsTotal)
            continue;
        selected.push(item);
        totalChars += item.text.length;
        docCounts.set(item.docId, currentPerDoc + 1);
    }
    const context = selected.map(s => ({
        id: s.id,
        doc_id: s.docId,
        chunk_id: s.chunkId,
        text: s.text,
        score: s.score,
    }));
    const citations = selected.map(s => ({
        doc_id: s.docId,
        chunk_id: s.chunkId,
        snippet: s.text.slice(0, 200),
    }));
    return {
        context,
        citations,
        usage: {
            chunks: selected.length,
            chars: totalChars,
            docs: docCounts.size,
        },
    };
}
//# sourceMappingURL=context.js.map