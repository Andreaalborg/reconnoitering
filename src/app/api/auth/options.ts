import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcrypt';

// Validate that NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  const error = new Error('NEXTAUTH_SECRET environment variable is not set. This is required for production security.');
  console.error('CRITICAL:', error.message);
  throw error;
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
          throw new Error('No user found with this email');
        }
        
        // Sjekk om e-post er verifisert
        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }
        
        // Verifiser passord med bcrypt
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        
        if (isValidPassword) {
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image, // Make sure to include image in the token
          };
        }
        
        throw new Error('Invalid password');
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image; // Add image to token
      }
      
      // Handle updates when the session is modified
      if (trigger === "update" && session) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image; // NextAuth uses 'picture' for images
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = (token.picture as string | null | undefined) || (token.image as string | null | undefined);
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dager
  },
};