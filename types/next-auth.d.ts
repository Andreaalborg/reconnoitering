import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// Utvid standard User-interface
declare module 'next-auth' {
  interface User extends DefaultUser {
    role?: string;
  }

  // Utvid standard Session-interface
  interface Session {
    user?: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }
}

// Utvid standard JWT-interface
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role?: string;
  }
} 