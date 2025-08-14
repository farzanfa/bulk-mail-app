async function unsubscribe(token: string) {
  const res = await fetch(`/api/unsubscribe/${token}`, { method: 'POST' });
  return res.ok;
}

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const ok = await unsubscribe(params.token);
  return (
    <div className="max-w-md mx-auto mt-24 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold">Unsubscribe</h1>
      <p className="mt-2">{ok ? 'You have been unsubscribed.' : 'Invalid or expired link.'}</p>
    </div>
  );
}


