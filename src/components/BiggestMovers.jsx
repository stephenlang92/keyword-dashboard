import { useMemo } from 'react';

export default function BiggestMovers({ keywords }) {
  const { gainers, losers } = useMemo(() => {
    const withChange = keywords
      .filter((k) => k.latest !== null && k.previous !== null)
      .map((k) => ({ ...k, change: k.previous - k.latest }))
      .sort((a, b) => b.change - a.change);

    return {
      gainers: withChange.filter((k) => k.change > 0).slice(0, 8),
      losers: withChange.filter((k) => k.change < 0).slice(-8).reverse(),
    };
  }, [keywords]);

  const Row = ({ item }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
      <div className="text-sm text-slate-300 truncate flex-1 mr-3" title={item.keyword}>
        {item.keyword}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-500">
          {item.previous === 101 ? '>100' : item.previous} → {item.latest === 101 ? '>100' : item.latest}
        </span>
        <span
          className={`text-sm font-semibold min-w-[50px] text-right ${
            item.change > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {item.change > 0 ? '+' : ''}{item.change}
        </span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-emerald-400">▲</span> Biggest Gainers
        </h2>
        {gainers.length === 0 ? (
          <div className="text-slate-500 text-sm">No data</div>
        ) : (
          gainers.map((k) => <Row key={k.keyword} item={k} />)
        )}
      </div>
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-red-400">▼</span> Biggest Losers
        </h2>
        {losers.length === 0 ? (
          <div className="text-slate-500 text-sm">No data</div>
        ) : (
          losers.map((k) => <Row key={k.keyword} item={k} />)
        )}
      </div>
    </div>
  );
}
