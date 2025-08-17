import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractVariables } from '@/lib/render';
import { getPlanLimits, getUserPlan } from '@/lib/plan';
import { ensureUserIdFromSession } from '@/lib/user';

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().default(''),
  text: z.string().optional().default('')
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const templates = await prisma.templates.findMany({ where: { user_id: userId }, orderBy: { updated_at: 'desc' } });
  
  // Get plan limits to show remaining quota
  const planLimits = await getPlanLimits(userId);
  const templateCount = templates.length;
  
  // Get current plan type
  const planType = await getUserPlan(userId);
  
  // Get subscription details if available
  const subscription = await prisma.user_subscriptions.findUnique({
    where: { user_id: userId },
    include: { plan: true }
  });
  
  return NextResponse.json({ 
    templates,
    limits: {
      used: templateCount,
      total: planLimits.maxTemplates,
      remaining: planLimits.maxTemplates === -1 ? -1 : Math.max(0, planLimits.maxTemplates - templateCount)
    },
    plan: {
      type: planType,
      name: subscription?.plan?.name || planType.charAt(0).toUpperCase() + planType.slice(1),
      isSubscribed: !!subscription && subscription.status === 'active'
    }
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { name, subject, html, text } = createSchema.parse(body);
  
  // Get plan limits from database
  const planLimits = await getPlanLimits(userId);
  
  if (planLimits.maxTemplates !== -1) {
    const count = await prisma.templates.count({ where: { user_id: userId } });
    if (count >= planLimits.maxTemplates) {
      return NextResponse.json({ 
        error: `Template limit reached. Your plan allows ${planLimits.maxTemplates} templates.`,
        upgradeRequired: true 
      }, { status: 402 });
    }
  }
  
  const variables = Array.from(new Set([...extractVariables(subject), ...extractVariables(html), ...extractVariables(text || '')]));
  const created = await prisma.templates.create({ data: { user_id: userId, name, subject, html, text, variables: variables as any } });
  return NextResponse.json({ template: created });
}


