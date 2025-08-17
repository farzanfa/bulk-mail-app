import { Badge } from './ui';

export function StatusBadge({ value }: { value: string }) {
  const status = value?.toLowerCase();
  
  if (status === 'draft' || status === 'created') {
    return <Badge variant="default">Draft</Badge>;
  }
  if (status === 'pending' || status === 'queued') {
    return <Badge variant="warning">Queued</Badge>;
  }
  if (status === 'running' || status === 'processing' || status === 'active') {
    return <Badge variant="info">Running</Badge>;
  }
  if (status === 'completed' || status === 'finished' || status === 'sent') {
    return <Badge variant="success">Completed</Badge>;
  }
  if (status === 'failed' || status === 'error') {
    return <Badge variant="error">Failed</Badge>;
  }
  if (status === 'paused' || status === 'stopped') {
    return <Badge variant="warning">Paused</Badge>;
  }
  
  return <Badge variant="default">{value}</Badge>;
}




