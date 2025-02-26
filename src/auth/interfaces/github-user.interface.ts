// src/auth/interfaces/github-user.interface.ts

export interface GithubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export interface AuthUserData {
  access_token: string;
  user: {
    id: number;
    github_id: string;
    email: string;
    avatar_url: string;
  };
}

export interface AuthResponse {
  message: string;
  data: AuthUserData | null;
}