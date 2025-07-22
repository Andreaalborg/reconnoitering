import 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user object to include custom properties.
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      provider?: string; // OAuth provider (google, facebook, credentials)
    };
  }

  /**
   * Extends the built-in user object.
   */
  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT token to include custom properties.
   */
  interface JWT {
    role?: string;
    provider?: string;
  }
} 