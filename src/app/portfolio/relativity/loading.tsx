export default function RelativityLoading() {
  return (
    <div className="space-y-8 pb-20">
      <div className="text-center pt-4 space-y-3">
        <div className="h-12 w-64 mx-auto rounded-xl bg-zinc-900/60 animate-pulse" />
        <div className="h-4 w-48 mx-auto rounded bg-zinc-900/60 animate-pulse" />
      </div>
      <div className="flex justify-center">
        <div className="h-12 w-64 rounded-full bg-zinc-900/60 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-zinc-800/40 bg-zinc-900/40 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-zinc-800/40 bg-zinc-900/40 animate-pulse" />
    </div>
  );
}
