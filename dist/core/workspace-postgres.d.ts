export interface Workspace {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
}
export declare function createWorkspace(userId: string, name: string): Promise<Workspace>;
export declare function getWorkspace(workspaceId: string): Promise<Workspace | null>;
export declare function getUserWorkspaces(userId: string): Promise<Workspace[]>;
export declare function updateWorkspace(workspaceId: string, userId: string, newName: string): Promise<Workspace | null>;
export declare function deleteWorkspace(workspaceId: string, userId: string): Promise<boolean>;
export declare function ensureDefaultWorkspace(userId: string): Promise<Workspace>;
//# sourceMappingURL=workspace-postgres.d.ts.map