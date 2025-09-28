import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plan';
import crypto from 'crypto';

export async function validateApiKey(req: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }
  
  const apiKey = authHeader.substring(7);
  
  // Hash the API key to compare with stored hash
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  // Find the API key
  const apiKeyRecord = await prisma.api_keys.findUnique({
    where: { key_hash: keyHash },
    include: { user: true }
  });
  
  if (!apiKeyRecord) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  // Check if key is expired
  if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }
  
  // Check if user has API access in their plan
  const planLimits = await getPlanLimits(apiKeyRecord.user_id);
  if (!planLimits.apiAccess) {
    return { valid: false, error: 'API access is not available in your current plan' };
  }
  
  // Update last used timestamp
  await prisma.api_keys.update({
    where: { id: apiKeyRecord.id },
    data: { last_used_at: new Date() }
  });
  
  return { valid: true, userId: apiKeyRecord.user_id };
}

export function generateApiKey(): { key: string; hash: string } {
  // Generate a secure random API key
  const key = `mw_${crypto.randomBytes(32).toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  return { key, hash };
}