import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';

// Validate that NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  const error = new Error('NEXTAUTH_SECRET environment variable is not set. This is required for production security.');
  console.error('CRITICAL:', error.message);
  throw error;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    // Facebook OAuth Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    
    // Existing Credentials Provider
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
        
        // Check if this user has OAuth providers linked
        if (user.oauthProviders && user.oauthProviders.length > 0) {
          const providers = user.oauthProviders.join(' or ');
          throw new Error(`This account uses ${providers} login. Please use the social login button instead.`);
        }
        
        // Check for old OAuth password placeholder
        if (user.password === 'oauth_user_no_password') {
          throw new Error('This account uses social login. Please use the Google or Facebook login button.');
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
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        await dbConnect();
        
        try {
          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });
          
          if (!dbUser) {
            // OAuth can only link to existing accounts, not create new ones
            console.log(`OAuth sign-in attempted for non-existing user: ${user.email}`);
            return false; // This will redirect to error page
          } else {
            // Link OAuth to existing user
            if (user.image && !dbUser.image) {
              dbUser.image = user.image;
            }
            
            // Mark that this user now has OAuth enabled
            if (!dbUser.oauthProviders) {
              dbUser.oauthProviders = [];
            }
            if (!dbUser.oauthProviders.includes(account.provider)) {
              dbUser.oauthProviders.push(account.provider);
            }
            
            await dbUser.save();
          }
          
          // Store the database user ID for the JWT callback
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          
          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }
      
      return true; // Allow sign in for credentials provider
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
        token.image = user.image;
        token.provider = account?.provider || 'credentials';
      }
      
      // Handle updates when the session is modified
      if (trigger === "update" && session) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = (token.picture as string | null | undefined) || (token.image as string | null | undefined);
        session.user.provider = token.provider as string;
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