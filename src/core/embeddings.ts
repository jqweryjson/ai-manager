const WORKER_BASE =
  process.env.EMBEDDINGS_WORKER_URL || "http://localhost:9040";

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${WORKER_BASE}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    // Поддержка обоих форматов: {embedding: number[]} и {vector: number[]}
    const vector: number[] | undefined = Array.isArray(data.embedding)
      ? data.embedding
      : Array.isArray(data.vector)
        ? data.vector
        : undefined;

    if (!vector) {
      throw new Error("Invalid embedding format");
    }

    return vector;
  } catch (error) {
    throw new Error(`Embedding failed: ${error}`);
  }
}

export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await fetch(`${WORKER_BASE}/embed/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Python worker возвращает {vectors: [...]}
    if (!data.vectors || !Array.isArray(data.vectors)) {
      throw new Error("Invalid batch embeddings format");
    }

    if (data.vectors.length !== texts.length) {
      throw new Error("Batch embeddings count mismatch");
    }

    return data.vectors;
  } catch (error) {
    throw new Error(`Batch embedding failed: ${error}`);
  }
}
