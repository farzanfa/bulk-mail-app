import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30 z-0" />
      
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-purple-300 to-pink-300 blur-[120px] opacity-30 animate-float z-0" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[45rem] w-[45rem] rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 blur-[120px] opacity-30 animate-float z-0" style={{ animationDelay: '-8s', animationDuration: '25s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[35rem] w-[35rem] rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 blur-[100px] opacity-20 animate-float z-0" style={{ animationDelay: '-4s', animationDuration: '30s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        <HomeClient />
      </div>
    </div>
  );
}


