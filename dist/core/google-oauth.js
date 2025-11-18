import { OAuth2Client } from "google-auth-library";
import { GOOGLE_OAUTH_CONFIG } from "../config/google-oauth.js";
const oauth2Client = new OAuth2Client(GOOGLE_OAUTH_CONFIG.clientId, GOOGLE_OAUTH_CONFIG.clientSecret, GOOGLE_OAUTH_CONFIG.redirectUri);
export function getGoogleAuthUrl() {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ];
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
    });
}
export async function getGoogleUserInfo(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
    if (!response.ok) {
        throw new Error("Failed to fetch user info from Google");
    }
    const data = await response.json();
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
    };
}
//# sourceMappingURL=google-oauth.js.map