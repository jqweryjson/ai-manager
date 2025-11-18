import { MilvusClient } from "@zilliz/milvus2-sdk-node";
export declare function getMilvusClient(): Promise<MilvusClient>;
export declare function initializeCollection(): Promise<void>;
export interface MilvusDocument {
    id: string;
    vector: number[];
    user_id: string;
    workspace_id: string;
    doc_id: string;
    chunk_id: string;
    text: string;
    [key: string]: any;
}
export interface MilvusSearchResult {
    id: string;
    user_id: string;
    workspace_id: string;
    doc_id: string;
    chunk_id: string;
    text: string;
    score: number;
}
export declare function insertDocuments(documents: MilvusDocument[]): Promise<void>;
export declare function deleteUserDocument(userId: string, workspaceId: string, docId: string): Promise<{
    deleted: boolean;
}>;
export declare function deleteUserWorkspaceDocuments(userId: string, workspaceId: string): Promise<{
    deleted: boolean;
}>;
export interface UserDocumentSummary {
    doc_id: string;
    chunks: number;
}
export declare function listUserDocuments(userId: string, workspaceId?: string): Promise<UserDocumentSummary[]>;
export declare function searchSimilar(vector: number[], userId: string, workspaceId: string, topK?: number): Promise<MilvusSearchResult[]>;
//# sourceMappingURL=milvus.d.ts.map