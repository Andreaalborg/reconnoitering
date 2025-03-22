import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
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
        
        // For enkel test - vi kan bruke bcrypt senere for sikkerhet
        if (credentials.password === user.password) {
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };