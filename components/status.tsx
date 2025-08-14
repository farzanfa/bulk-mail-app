export function StatusBadge({ value }: { value: string }) {
  const v = String(value).toLowerCase();
  let cls = 'bg-gray-100 text-gray-800';
  if (['running', 'sent'].includes(v)) cls = 'bg-green-100 text-green-700';
  if (['paused'].includes(v)) cls = 'bg-yellow-100 text-yellow-700';
  if (['failed'].includes(v)) cls = 'bg-red-100 text-red-700';
  if (['draft', 'pending', 'skipped'].includes(v)) cls = 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${cls}`}>{value}</span>;
}




