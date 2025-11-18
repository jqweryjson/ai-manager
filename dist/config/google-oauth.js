import { config } from "dotenv";
config();
export const GOOGLE_OAUTH_CONFIG = {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${process.env.BACKEND_URL || "http://localhost:4001"}/api/auth/callback`,
};
if (!GOOGLE_OAUTH_CONFIG.clientId || !GOOGLE_OAUTH_CONFIG.clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
}
//# sourceMappingURL=google-oauth.js.map