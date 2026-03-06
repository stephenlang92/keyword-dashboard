import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis,
} from 'recharts';

const X_TICKS = [101, 75, 50, 30, 20, 10, 1];

export default function VolumeScatter({ keywords }) {
  const data = useMemo(() => {
    return keywords
      .filter((k) => k.latest !== null && k.volume > 0)
      .map((k) => ({
        keyword: k.keyword,
        position: k.latest,
        volume: k.volume,
      }));
  }, [keywords]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm">
        <div className="font-semibold text-white mb-1">{d.keyword}</div>
        <div className="text-slate-400">Position: <span className="text-white">{d.position === 101 ? '>100' : d.position}</span></div>
        <div className="text-slate-400">Volume: <span className="text-white">{d.volume.toLocaleString()}</span></div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <h2 className="text-lg font-semibold mb-1">Volume vs Position</h2>
      <p className="text-xs text-slate-500 mb-3">Top-right = high volume + good rank. Bottom-left = opportunity keywords (high volume, bad rank)</p>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ bottom: 25, left: 5, right: 5, top: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            dataKey="position"
            name="Position"
            domain={[101, 1]}
            allowDataOverflow
            ticks={X_TICKS}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            label={{ value: 'Position (\u2190 worse | better \u2192)', position: 'bottom', fill: '#94a3b8', offset: 5 }}
          />
          <YAxis
            type="number"
            dataKey="volume"
            name="Volume"
            scale="log"
            domain={[1, 'auto']}
            allowDataOverflow
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            label={{ value: 'Volume (log)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <ZAxis range={[30, 200]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#3b82f6" opacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
