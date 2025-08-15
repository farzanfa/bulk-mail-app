import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { Card, Section } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user;
  if (!user?.email || !isAdminEmail(user.email)) redirect('/login');

  const [users, totals] = await Promise.all([
    prisma.users.findMany({ select: { id: true, email: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 50 }),
    (async () => {
      const [u, c, t, ca, r] = await Promise.all([
        prisma.users.count(),
        prisma.contacts.count(),
        prisma.templates.count(),
        prisma.campaigns.count(),
        prisma.campaign_recipients.count(),
      ]);
      return { users: u, contacts: c, templates: t, campaigns: ca, recipients: r };
    })()
  ]);

  // Per-user rollups
  const perUser = await Promise.all(users.map(async (u) => {
    const [contacts, templates, campaigns] = await Promise.all([
      prisma.contacts.count({ where: { user_id: u.id } }),
      prisma.templates.count({ where: { user_id: u.id } }),
      prisma.campaigns.count({ where: { user_id: u.id } }),
    ]);
    return { ...u, contacts, templates, campaigns } as any;
  }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4"><div className="text-sm text-gray-500">Users</div><div className="text-2xl">{totals.users}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-500">Contacts</div><div className="text-2xl">{totals.contacts}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-500">Templates</div><div className="text-2xl">{totals.templates}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-500">Campaigns</div><div className="text-2xl">{totals.campaigns}</div></Card>
        <Card className="p-4"><div className="text-sm text-gray-500">Recipients</div><div className="text-2xl">{totals.recipients}</div></Card>
      </div>
      <Section title="Recent users">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4">Contacts</th>
                <th className="py-2 pr-4">Templates</th>
                <th className="py-2 pr-4">Campaigns</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {perUser.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 pr-4 break-all">{u.email}</td>
                  <td className="py-2 pr-4">{new Date(u.created_at as any).toLocaleString()}</td>
                  <td className="py-2 pr-4">{u.contacts}</td>
                  <td className="py-2 pr-4">{u.templates}</td>
                  <td className="py-2 pr-4">{u.campaigns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}


