import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import dbConnect from './mongodb';
import User from '@/models/User';

// Legg til type for session
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          return null;
        }
        
        const isValid = await compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      
      if (trigger === "update" && session) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.picture || token.image;
      }
      return session;
    }
  },
  secret: "THIS_IS_A_VERY_SECURE_SECRET_FOR_RECONNOITERING_APP",
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dager
  },
}; 