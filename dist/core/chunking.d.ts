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
export declare function chunkText(text: string, userId: string, docId: string, source: string, chunkSize?: number, overlap?: number): Chunk[];
//# sourceMappingURL=chunking.d.ts.map