export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  googleId?: string;
  telegramId?: string;
  vkId?: number;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
