import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid z-0" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-yellow-200 blur-[80px] opacity-60 animate-float z-0" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-[30rem] w-[30rem] rounded-full bg-yellow-100 blur-[90px] opacity-60 animate-float z-0" style={{ animationDelay: '-6s' }} />
      <div className="relative z-10">
        <HomeClient />
      </div>
    </div>
  );
}


