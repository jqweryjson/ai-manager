export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
