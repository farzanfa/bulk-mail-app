import dynamic from 'next/dynamic';

// Lazy load PWAInstaller as it's not critical for initial render
const PWAInstaller = dynamic(() => import('./PWAInstaller'), {
  ssr: false,
  loading: () => null,
});

export default function PWAInstallerWrapper() {
  return <PWAInstaller />;
}