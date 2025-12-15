interface ListenerController {
    startListening(accountId: string, userId: string): Promise<void>;
    getStatus(): unknown;
}
export declare function startHttpServer(controller: ListenerController): Promise<void>;
export {};
//# sourceMappingURL=httpServer.d.ts.map