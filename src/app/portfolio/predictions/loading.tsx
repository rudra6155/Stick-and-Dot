export default function PredictionsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Command bar skeleton */}
      <div className="sticky top-24 z-30 rounded-2xl border border-zinc-800/60 bg-black/85 backdrop-blur-xl p-4">
        <div className="h-10 bg-zinc-900/60 rounded-xl animate-pulse" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-xl bg-zinc-900/60 animate-pulse" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl border border-zinc-800/40 bg-zinc-900/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
