import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

export default function RankingChart({ keywords, dates }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return keywords
      .filter((k) => k.keyword.toLowerCase().includes(q))
      .slice(0, 20);
  }, [search, keywords]);

  const toggleKeyword = (kw) => {
    setSelected((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : prev.length < 10 ? [...prev, kw] : prev
    );
  };

  const chartData = useMemo(() => {
    return dates.map((date, i) => {
      const point = { date };
      selected.forEach((kw) => {
        const found = keywords.find((k) => k.keyword === kw);
        if (found) point[kw] = found.rankings[i];
      });
      return point;
    });
  }, [selected, dates, keywords]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <h2 className="text-lg font-semibold mb-3">Ranking Over Time</h2>

      {/* Search & select keywords */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search keywords to add to chart..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filtered.length > 0 && search.trim() && (
          <div className="mt-1 bg-slate-700 rounded-lg max-h-40 overflow-y-auto">
            {filtered.map((k) => (
              <button
                key={k.keyword}
                onClick={() => { toggleKeyword(k.keyword); setSearch(''); }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-600 ${
                  selected.includes(k.keyword) ? 'text-blue-400' : 'text-slate-300'
                }`}
              >
                {k.keyword}
                <span className="text-slate-500 ml-2">Vol: {k.volume}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map((kw, i) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}
            >
              {kw.length > 30 ? kw.slice(0, 30) + '...' : kw}
              <button onClick={() => toggleKeyword(kw)} className="ml-1 hover:text-white">&times;</button>
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      {selected.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-12">
          Search and select keywords above to see ranking trends
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              reversed
              domain={[1, 'auto']}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value, name) => [value === 101 ? '>100' : value, name.length > 40 ? name.slice(0, 40) + '...' : name]}
            />
            {selected.map((kw, i) => (
              <Line
                key={kw}
                type="monotone"
                dataKey={kw}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
