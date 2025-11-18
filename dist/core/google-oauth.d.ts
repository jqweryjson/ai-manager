export declare function getGoogleAuthUrl(): string;
export interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture: string;
}
export declare function getGoogleUserInfo(code: string): Promise<GoogleUserInfo>;
//# sourceMappingURL=google-oauth.d.ts.map