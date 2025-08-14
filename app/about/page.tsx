export const dynamic = 'force-static';
export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1>About</h1>
      <p>MailApp is a Vercel-native bulk mailing platform designed for simplicity, speed, and security.</p>
      <p>It uses Next.js App Router, Google OAuth for sending with Gmail, and Vercel services for storage, background jobs, and scheduling.</p>
    </main>
  );
}


