import dynamic from 'next/dynamic';

export const CampaignNewModal = dynamic(
  () => import('../CampaignNewModal').then(mod => ({ default: mod.CampaignNewModal })),
  {
    loading: () => null,
  }
);