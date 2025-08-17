import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateApiKey } from '@/lib/api-auth';
import { z } from 'zod';

// GET /api/v1/campaigns - List campaigns
export async function GET(req: NextRequest) {
  const validation = await validateApiKey(req);
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }
  
  const userId = validation.userId!;
  
  const campaigns = await prisma.campaigns.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      name: true,
      status: true,
      created_at: true,
      started_at: true,
      completed_at: true,
      _count: {
        select: {
          recipients: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
  
  return NextResponse.json({
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      created_at: c.created_at,
      started_at: c.started_at,
      completed_at: c.completed_at,
      total_recipients: c._count.recipients
    }))
  });
}

// POST /api/v1/campaigns - Create a campaign
const createCampaignSchema = z.object({
  name: z.string().min(1),
  google_account_id: z.string(),
  template_id: z.string(),
  upload_id: z.string(),
  filters: z.any().default({})
});

export async function POST(req: NextRequest) {
  const validation = await validateApiKey(req);
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }
  
  const userId = validation.userId!;
  
  try {
    const body = await req.json();
    const data = createCampaignSchema.parse(body);
    
    // Verify ownership of resources
    const [googleAccount, template, upload] = await Promise.all([
      prisma.google_accounts.findFirst({ where: { id: data.google_account_id, user_id: userId } }),
      prisma.templates.findFirst({ where: { id: data.template_id, user_id: userId } }),
      prisma.uploads.findFirst({ where: { id: data.upload_id, user_id: userId } })
    ]);
    
    if (!googleAccount || !template || !upload) {
      return NextResponse.json({ error: 'Invalid resource IDs' }, { status: 400 });
    }
    
    const campaign = await prisma.campaigns.create({
      data: {
        user_id: userId,
        name: data.name,
        google_account_id: data.google_account_id,
        template_id: data.template_id,
        upload_id: data.upload_id,
        filters: data.filters as any,
        status: 'draft'
      }
    });
    
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}