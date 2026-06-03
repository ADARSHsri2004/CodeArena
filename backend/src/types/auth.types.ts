export interface JwtPayload {
  id: string;
  email: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  elo: number;
  createdAt: Date;
}