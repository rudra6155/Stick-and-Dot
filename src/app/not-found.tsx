import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <p className="relative text-[120px] md:text-[180px] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-zinc-300 to-zinc-700 leading-none select-none">
          404
        </p>
      </div>
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-3">
        Market Not Found
      </h1>
      <p className="text-zinc-500 text-sm font-mono max-w-sm mb-10">
        The page you're looking for doesn't exist, was moved, or is restricted to authorized participants.
      </p>
      <div className="flex gap-4">
        <Link
          href="/portfolio"
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
        >
          Go to Portfolio
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest border border-zinc-800 transition-all"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
