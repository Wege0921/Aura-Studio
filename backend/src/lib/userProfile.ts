import { prisma } from './prisma';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

export async function ensureUserProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: any;
}) {
  // 1. Look up by Supabase UUID
  let user = await prisma.user.findUnique({ where: { id: authUser.id }, select: USER_SELECT });
  if (user) return user;

  // 2. Fall back to email lookup (handles seeded/hardcoded-id profiles)
  const email = authUser.email || '';
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email }, select: USER_SELECT });
    if (byEmail) {
      // Update the profile's id to the real Supabase UUID so future lookups work
      user = await prisma.user.update({
        where: { email },
        data: { id: authUser.id },
        select: USER_SELECT,
      });
      return user;
    }
  }

  // 3. Create a brand-new profile (always USER — admin only set manually or via seed)
  const meta = authUser.user_metadata || {};
  user = await prisma.user.create({
    data: {
      id: authUser.id,
      email,
      name: meta.name || meta.full_name || 'User',
      phone: meta.phone || null,
      role: 'USER',
    },
    select: USER_SELECT,
  });

  return user;
}
