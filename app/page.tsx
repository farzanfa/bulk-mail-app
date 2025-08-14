export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MailApp</h1>
        <p className="text-gray-600 mt-2">Production-ready bulk mailer on Vercel</p>
        <div className="mt-6 flex gap-3 justify-center">
          <a href="/dashboard" className="px-4 py-2 bg-black text-white rounded">Dashboard</a>
          <a href="/templates" className="px-4 py-2 border rounded">Templates</a>
          <a href="/uploads" className="px-4 py-2 border rounded">Uploads</a>
        </div>
      </div>
    </main>
  );
}


