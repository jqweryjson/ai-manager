export interface Chunk {
  id: string;
  text: string;
  metadata: {
    user_id: string;
    doc_id: string;
    chunk_index: number;
    source: string;
    updated_at: string;
  };
}

export function chunkText(
  text: string,
  userId: string,
  docId: string,
  source: string,
  chunkSize: number = 800,
  overlap: number = 0.18
): Chunk[] {
  const chunks: Chunk[] = [];
  const step = Math.floor(chunkSize * (1 - overlap));

  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(i + chunkSize, text.length);
    const chunkText = text.slice(i, end).trim();

    if (chunkText.length === 0) continue;

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
