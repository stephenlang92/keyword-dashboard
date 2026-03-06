import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const BUCKETS = [
  { label: 'Top 3', min: 1, max: 3, color: '#10b981' },
  { label: 'Top 10', min: 4, max: 10, color: '#3b82f6' },
  { label: 'Top 30', min: 11, max: 30, color: '#f59e0b' },
  { label: 'Top 50', min: 31, max: 50, color: '#f97316' },
  { label: 'Top 100', min: 51, max: 100, color: '#ef4444' },
  { label: '>100', min: 101, max: Infinity, color: '#64748b' },
];

export default function DistributionChart({ keywords }) {
  const data = useMemo(() => {
    return BUCKETS.map((b) => ({
      name: b.label,
      count: keywords.filter(
        (k) => k.latest !== null && k.latest >= b.min && k.latest <= b.max
      ).length,
      color: b.color,
    }));
  }, [keywords]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <h2 className="text-lg font-semibold mb-3">Position Distribution</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
