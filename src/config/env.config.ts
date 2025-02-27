// src/config/env.config.ts
export default () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: '7d',
  },
  github: {
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  },
});