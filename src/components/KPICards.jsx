export default function KPICards({ keywords }) {
  const total = keywords.length;
  const withLatest = keywords.filter((k) => k.latest !== null);
  const top3 = withLatest.filter((k) => k.latest <= 3).length;
  const top10 = withLatest.filter((k) => k.latest <= 10).length;
  const top30 = withLatest.filter((k) => k.latest <= 30).length;

  const avgPos =
    withLatest.length > 0
      ? (
          withLatest.reduce((sum, k) => sum + k.latest, 0) / withLatest.length
        ).toFixed(1)
      : '-';

  const improved = withLatest.filter(
    (k) => k.previous !== null && k.latest < k.previous
  ).length;
  const declined = withLatest.filter(
    (k) => k.previous !== null && k.latest > k.previous
  ).length;

  const cards = [
    { label: 'Total Keywords', value: total, color: 'from-blue-500 to-blue-700' },
    { label: 'Top 3', value: top3, sub: `${((top3 / total) * 100).toFixed(1)}%`, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Top 10', value: top10, sub: `${((top10 / total) * 100).toFixed(1)}%`, color: 'from-cyan-500 to-cyan-700' },
    { label: 'Top 30', value: top30, sub: `${((top30 / total) * 100).toFixed(1)}%`, color: 'from-violet-500 to-violet-700' },
    { label: 'Avg Position', value: avgPos, color: 'from-amber-500 to-amber-700' },
    { label: 'Improved', value: improved, sub: 'vs last week', color: 'from-green-500 to-green-700' },
    { label: 'Declined', value: declined, sub: 'vs last week', color: 'from-red-500 to-red-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-gradient-to-br ${c.color} rounded-xl p-4 shadow-lg`}
        >
          <div className="text-xs font-medium text-white/70 uppercase tracking-wide">
            {c.label}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{c.value}</div>
          {c.sub && <div className="text-xs text-white/60 mt-0.5">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
