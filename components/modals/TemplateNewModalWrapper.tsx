import dynamic from 'next/dynamic';

export const TemplateNewModal = dynamic(
  () => import('../TemplateNewModal').then(mod => ({ default: mod.TemplateNewModal })),
  {
    loading: () => null,
  }
);