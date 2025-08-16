import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const search = searchParams.get('search') || '';
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'email') {
      orderBy.email = sortDir;
    } else {
      orderBy.created_at = sortDir;
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          full_name: true,
          company: true,
          role: true,
          created_at: true,
          onboarding_completed_at: true
        }
      }),
      prisma.users.count({ where: whereClause })
    ]);

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [uploads_count, templates_count, campaigns_count, contacts_count] = await Promise.all([
          prisma.uploads.count({ where: { user_id: user.id } }),
          prisma.templates.count({ where: { user_id: user.id } }),
          prisma.campaigns.count({ where: { user_id: user.id } }),
          prisma.contacts.count({ where: { user_id: user.id } })
        ]);

        return {
          ...user,
          uploads_count,
          templates_count,
          campaigns_count,
          contacts_count
        };
      })
    );

    return NextResponse.json({
      users: usersWithCounts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const deleteSchema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ids } = deleteSchema.parse(body);

    // Delete users and all their data (cascade will handle related data)
    const result = await prisma.users.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
