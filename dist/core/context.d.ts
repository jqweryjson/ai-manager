export interface RetrievedChunk {
    id: string;
    docId: string;
    chunkId: string;
    text: string;
    score: number;
}
export interface BuildContextOptions {
    maxChunksTotal: number;
    maxChunksPerDoc: number;
    maxCharsTotal: number;
}
export interface BuiltContext {
    context: Array<{
        id: string;
        doc_id: string;
        chunk_id: string;
        text: string;
        score: number;
    }>;
    citations: Array<{
        doc_id: string;
        chunk_id: string;
        snippet: string;
    }>;
    usage: {
        chunks: number;
        chars: number;
        docs: number;
    };
}
export declare function buildContextFromRetrieved(retrieved: RetrievedChunk[], options: BuildContextOptions): BuiltContext;
//# sourceMappingURL=context.d.ts.map