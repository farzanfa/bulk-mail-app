import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid"></div>
      <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-yellow-200 blur-3xl opacity-40 animate-float"></div>
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-yellow-100 blur-3xl opacity-40 animate-float" style={{ animationDelay: '-6s' }}></div>
      <HomeClient />
    </div>
  );
}


