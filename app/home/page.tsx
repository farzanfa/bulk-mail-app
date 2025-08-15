import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid z-0"></div>
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[24rem] w-[24rem] rounded-full bg-yellow-200 blur-3xl opacity-50 animate-float z-0"></div>
      <div className="pointer-events-none absolute bottom-[-12%] right-[-12%] h-[28rem] w-[28rem] rounded-full bg-yellow-100 blur-3xl opacity-50 animate-float z-0" style={{ animationDelay: '-6s' }}></div>
      <div className="relative z-10">
        <HomeClient />
      </div>
    </div>
  );
}


