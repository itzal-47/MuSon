import { Music } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <div className="w-24 h-24 rounded-3xl accent-gradient flex items-center justify-center mb-6 glow-accent">
          <Music size={48} className="text-black" />
        </div>
      </div>
      <h1 className="text-4xl font-black tracking-tight text-white">MuSon</h1>
      <p className="text-neutral-500 text-sm mt-2">Música Angolana</p>
      <div className="absolute bottom-12 flex gap-1.5">
        <span className="w-2 h-2 rounded-full accent-gradient animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full accent-gradient animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full accent-gradient animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
