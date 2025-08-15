import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id as string;
      }
      // Link Google on first sign-in with Google
      if (account?.provider === 'google') {
        const email = (profile as any)?.email as string | undefined;
        if (email) {
          let appUser = await prisma.users.findUnique({ where: { email } });
          if (!appUser) {
            // Auto-create app user; mark verified
            appUser = await prisma.users.create({ data: { email, password_hash: await bcrypt.hash(`google-${Date.now()}`, 10), email_verified_at: new Date() } });
          }
          token.sub = appUser.id;
          // Upsert google account with refresh token if present
          const googleUserId = (profile as any)?.sub as string | undefined;
          const refresh = (account as any)?.refresh_token as string | undefined;
          if (googleUserId) {
            if (refresh) {
              const { encrypt } = await import('@/lib/crypto');
              await prisma.google_accounts.upsert({
                where: { user_id_google_user_id: { user_id: appUser.id, google_user_id: googleUserId } },
                update: { email, refresh_token_encrypted: encrypt(refresh) },
                create: { user_id: appUser.id, google_user_id: googleUserId, email, refresh_token_encrypted: encrypt(refresh) }
              });
            } else {
              // Ensure record exists even if refresh token not returned this time
              await prisma.google_accounts.upsert({
                where: { user_id_google_user_id: { user_id: appUser.id, google_user_id: googleUserId } },
                update: { email },
                create: { user_id: appUser.id, google_user_id: googleUserId, email, refresh_token_encrypted: 'missing' }
              });
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        (session as any).user.id = token.sub;
      }
      return session;
    }
  }
};


